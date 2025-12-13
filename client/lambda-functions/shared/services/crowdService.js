// 인구 밀집도 비즈니스 로직 (DynamoDB 기반)
const axios = require("axios");
const { getRedisClient } = require("../utils/redisClient");
const areaMapping = require("../utils/areaMapping");
const CrowdHistoryDynamo = require("../models/CrowdHistoryDynamo");

class CrowdService {
  constructor() {
    this.redis = getRedisClient();
    this.ttlSeconds = 60*10; // 10분 TTL
    this.baseUrl = process.env.SEOUL_POPULATION_API_URL || "http://openapi.seoul.go.kr:8088";
    this.apiKey = process.env.SEOUL_API_KEY || "47464b765073696c33366142537a7a";
    
    // POI001 ~ POI128 생성
    this.areaCodes = this.generateAreaCodes();
    
    console.log(`📊 CrowdService 초기화: ${this.areaCodes.length}개 지역`);
  }

  /**
   * Area 코드 생성 (POI001 ~ POI128)
   */
  generateAreaCodes() {
    const codes = [];
    const allAreas = areaMapping.getAllAreas();
    allAreas.forEach(area => {
      codes.push(area.areaCode);
    });
    return codes.length > 0 ? codes : this.generateDefaultCodes();
  }

  /**
   * 기본 코드 생성 (매핑 파일 로드 실패 시)
   */
  generateDefaultCodes() {
    return Array.from({ length: 128 }, (_, i) => `POI${String(i + 1).padStart(3, "0")}`);
  }

  /**
   * 특정 지역 코드 데이터 가져오기 및 캐싱
   */
  async fetchAndCacheOne(areaCode, saveHistory = false) {
    const url = `${this.baseUrl}/${this.apiKey}/JSON/citydata_ppltn/1/5/${areaCode}`;
    const cacheKey = `crowd:${areaCode}`;
    
    try {
      const response = await axios.get(url, { responseType: "json", timeout: 15000 });
      
      // Area 매핑 정보 추가
      const areaInfo = areaMapping.getAreaByCode(areaCode);
      
      const payload = {
        areaCode,
        areaInfo: areaInfo || null,
        data: response.data,
        fetchedAt: new Date().toISOString()
      };
      
      // Redis 캐싱
      await this.redis.safeSetEx(cacheKey, this.ttlSeconds, JSON.stringify(payload));
      
      // 플래그가 true일 때만 DynamoDB에 히스토리 저장
      if (saveHistory) {
        await this.saveToHistory(payload);
      }
      
      return payload;
    } catch (error) {
      // 실패 시 기존 캐시 사용 시도
      const cached = await this.redis.safeGet(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (_) {}
      }
      throw error;
    }
  }

  /**
   * DynamoDB에 히스토리 저장
   */
  async saveToHistory(payload) {
    try {
      // 인구수 추출 (API 응답에서)
      const peopleCount = this.extractPeopleCount(payload.data);
      const congestionLevel = this.calculateCongestionLevel(peopleCount);
      
      // DynamoDB에 저장
      await CrowdHistoryDynamo.create({
        areaCode: payload.areaCode,
        areaName: payload.areaInfo?.areaName || payload.areaCode,
        category: payload.areaInfo?.category || '기타',
        peopleCount,
        congestionLevel,
        rawData: payload.data
      });
    } catch (error) {
      // 히스토리 저장 실패해도 메인 기능에 영향 없도록 에러만 로그
      console.error(`❌ 히스토리 저장 실패 (${payload.areaCode}):`, error.message);
    }
  }

  /**
   * API 응답에서 인구수 추출
   */
  extractPeopleCount(apiData) {
    try {
      const ppltnArray = apiData?.['SeoulRtd.citydata_ppltn'];
      
      if (!ppltnArray || !Array.isArray(ppltnArray) || ppltnArray.length === 0) {
        return 0;
      }
      
      const data = ppltnArray[0];
      const minPop = parseInt(data.AREA_PPLTN_MIN) || 0;
      const maxPop = parseInt(data.AREA_PPLTN_MAX) || 0;
      
      if (minPop > 0 && maxPop > 0) {
        return Math.floor((minPop + maxPop) / 2);
      }
      
      return minPop || maxPop || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 혼잡도 레벨 계산 (1-5)
   */
  calculateCongestionLevel(peopleCount) {
    if (peopleCount >= 10000) return 5;
    if (peopleCount >= 5000) return 4;
    if (peopleCount >= 2000) return 3;
    if (peopleCount >= 500) return 2;
    return 1;
  }

  /**
   * 전체 인구 데이터 조회
   */
  async getCrowdData() {
    const results = [];
    
    for (const areaCode of this.areaCodes) {
      const cacheKey = `crowd:${areaCode}`;
      const cached = await this.redis.safeGet(cacheKey);
      
      if (cached) {
        try {
          results.push(JSON.parse(cached));
          continue;
        } catch (_) {}
      }
      
      // 캐시 미스 → 개별 즉시 갱신
      try {
        const fresh = await this.fetchAndCacheOne(areaCode);
        results.push(fresh);
      } catch (e) {
        results.push({ 
          areaCode,
          error: e.message,
          areaInfo: areaMapping.getAreaByCode(areaCode) || null
        });
      }
    }
    
    return results;
  }

  /**
   * 특정 지역 코드의 인구 데이터 조회
   */
  async getCrowdDataByAreaCode(areaCode) {
    if (!areaMapping.isValidAreaCode(areaCode)) {
      throw new Error(`유효하지 않은 지역 코드입니다: ${areaCode}`);
    }

    const cacheKey = `crowd:${areaCode}`;
    const cached = await this.redis.safeGet(cacheKey);
    
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (_) {}
    }
    
    return await this.fetchAndCacheOne(areaCode);
  }

  /**
   * 인파 변화 추이 데이터 조회 (히스토리)
   */
  async getCrowdHistory(areaCode, hours = 24) {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const endTime = new Date();
    
    const history = await CrowdHistoryDynamo.findByAreaCode(areaCode, startTime, endTime);

    // 시계열 데이터 변환
    const timeseries = history.map(h => ({
      timestamp: new Date(h.timestamp),
      peopleCount: h.peopleCount,
      congestionLevel: h.congestionLevel
    }));

    // 통계 계산
    const peopleCounts = history.map(h => h.peopleCount);
    const congestionLevels = history.map(h => h.congestionLevel);
    
    const avgPeople = peopleCounts.length > 0 
      ? Math.round(peopleCounts.reduce((a, b) => a + b, 0) / peopleCounts.length)
      : 0;
    
    const avgCongestion = congestionLevels.length > 0
      ? (congestionLevels.reduce((a, b) => a + b, 0) / congestionLevels.length).toFixed(1)
      : 0;

    return {
      areaCode,
      areaName: areaMapping.getAreaByCode(areaCode)?.areaName || areaCode,
      period: `최근 ${hours}시간`,
      dataCount: timeseries.length,
      timeseries,
      average: {
        peopleCount: avgPeople,
        congestionLevel: parseFloat(avgCongestion)
      }
    };
  }
}

module.exports = new CrowdService();

