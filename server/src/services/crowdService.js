// 인구 밀집도 비즈니스 로직
const axios = require("axios");
const { getRedisClient } = require("../utils/redisClient");
const areaMapping = require("../utils/areaMapping");
const CrowdHistory = require("../models/CrowdHistory");

class CrowdService {
  constructor() {
    this.redis = getRedisClient();
    this.ttlSeconds = 60; // 60초 TTL
    this.pollingInterval = 60 * 1000; // 1분마다 갱신
    this.historyInterval = 10 * 60 * 1000; // 10분마다 MongoDB 저장
    this.baseUrl = process.env.SEOUL_POPULATION_API_URL || "http://openapi.seoul.go.kr:8088";
    this.apiKey = process.env.SEOUL_API_KEY || "47464b765073696c33366142537a7a";
    
    // POI001 ~ POI128 생성
    this.areaCodes = this.generateAreaCodes();
    
    // 마지막 히스토리 저장 시간
    this.lastHistorySaved = Date.now();
    
    // 서버 시작 시 폴링 시작
    this.startPolling();
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
   * 폴링 시작
   */
  startPolling() {
    console.log("⏱ Crowd data polling started (every 60s)");
    // 초기 1회 즉시 수행
    this.fetchAllAreaCodes().catch((err) => console.error("Crowd polling init failed:", err));
    // 주기적 수행
    setInterval(() => {
      this.fetchAllAreaCodes().catch((err) => console.error("Crowd polling failed:", err));
    }, this.pollingInterval);
  }

  /**
   * 모든 지역 코드 데이터 가져오기
   */
  async fetchAllAreaCodes() {
    const now = Date.now();
    const shouldSaveHistory = (now - this.lastHistorySaved >= this.historyInterval);
    
    // 모든 지역 데이터 가져오기
    for (const areaCode of this.areaCodes) {
      await this.fetchAndCacheOne(areaCode, shouldSaveHistory).catch((e) => {
        console.error(`Fetch failed for areaCode=${areaCode}:`, e.message);
      });
    }
    
    // 히스토리 저장 완료 후 시간 업데이트
    if (shouldSaveHistory) {
      this.lastHistorySaved = now;
      console.log(`✅ 히스토리 저장 완료: ${this.areaCodes.length}개 지역`);
    }
  }

  /**
   * 특정 지역 코드 데이터 가져오기 및 캐싱
   */
  async fetchAndCacheOne(areaCode, saveHistory = false) {
    const url = `${this.baseUrl}/${this.apiKey}/JSON/citydata_ppltn/1/5/${areaCode}`;
    const cacheKey = `crowd:${areaCode}`;
    
    try {
      const response = await axios.get(url, { responseType: "json", timeout: 10000 });
      
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
      
      // 플래그가 true일 때만 MongoDB에 히스토리 저장
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
   * MongoDB에 히스토리 저장 (실제 저장 로직)
   */
  async saveToHistory(payload) {
    try {
      // 인구수 추출 (API 응답에서)
      const peopleCount = this.extractPeopleCount(payload.data);
      const congestionLevel = this.calculateCongestionLevel(peopleCount);
      
      // MongoDB에 저장
      await CrowdHistory.create({
        areaCode: payload.areaCode,
        areaName: payload.areaInfo?.areaName || payload.areaCode,
        category: payload.areaInfo?.category || '기타',
        peopleCount,
        congestionLevel,
        timestamp: new Date()
      });
    } catch (error) {
      // 히스토리 저장 실패해도 메인 기능에 영향 없도록 에러만 로그
      console.error(`히스토리 저장 실패 (${payload.areaCode}):`, error.message);
    }
  }

  /**
   * API 응답에서 인구수 추출
   */
  extractPeopleCount(apiData) {
    try {
      // citydata_ppltn API 응답 구조에 맞게 조정
      const ppltn = apiData?.CITYDATA_PPLTN?.LIVE_PPLTN_STTS;
      if (ppltn && ppltn.length > 0) {
        return parseInt(ppltn[0].AREA_PPLTN_MIN) || 0;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 혼잡도 레벨 계산 (1-5)
   */
  calculateCongestionLevel(peopleCount) {
    if (peopleCount >= 10000) return 5; // 매우 혼잡
    if (peopleCount >= 5000) return 4;  // 혼잡
    if (peopleCount >= 2000) return 3;  // 보통
    if (peopleCount >= 500) return 2;   // 여유
    return 1; // 한산
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
    // Area 코드 유효성 검사
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
    
    // 캐시 미스 → 즉시 갱신
    return await this.fetchAndCacheOne(areaCode);
  }

  /**
   * 인파 변화 추이 데이터 조회 (히스토리)
   */
  async getCrowdHistory(areaCode, hours = 24) {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const history = await CrowdHistory.find({
      areaCode,
      timestamp: { $gte: startTime }
    }).sort({ timestamp: 1 }).lean();

    // 통계 계산
    const stats = this.calculateHistoryStats(history);

    return {
      areaCode,
      areaInfo: areaMapping.getAreaByCode(areaCode),
      period: `최근 ${hours}시간`,
      data: history,
      stats
    };
  }

  /**
   * 히스토리 통계 계산
   */
  calculateHistoryStats(history) {
    if (history.length === 0) {
      return {
        average: 0,
        max: 0,
        min: 0,
        trend: 0,
        changeRate: 0
      };
    }

    const peopleCounts = history.map(h => h.peopleCount);
    const average = peopleCounts.reduce((a, b) => a + b, 0) / peopleCounts.length;
    const max = Math.max(...peopleCounts);
    const min = Math.min(...peopleCounts);

    // 증감률 계산 (첫 데이터 대비 마지막 데이터)
    const first = peopleCounts[0] || 1;
    const last = peopleCounts[peopleCounts.length - 1] || 0;
    const changeRate = ((last - first) / first * 100).toFixed(2);

    // 추세 계산 (단순 선형)
    const trend = last > first ? 1 : (last < first ? -1 : 0);

    return {
      average: Math.round(average),
      max,
      min,
      trend,
      changeRate: parseFloat(changeRate)
    };
  }
}

module.exports = new CrowdService();
