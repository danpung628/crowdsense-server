// 인구 밀집도 비즈니스 로직
const axios = require("axios");
const { getRedisClient } = require("../utils/redisClient");
const areaMapping = require("../utils/areaMapping");
const CrowdHistory = require("../models/CrowdHistory");

class CrowdService {
  constructor() {
    this.redis = getRedisClient();
    this.ttlSeconds = 60*10; // 10분 TTL
    this.pollingInterval = 10*60 * 1000; // 10분마다 갱신
    this.historyInterval = 30 * 60 * 1000; // 1분마다 MongoDB 저장 (테스트용, 원래는 10분)
    this.baseUrl = process.env.SEOUL_POPULATION_API_URL || "http://openapi.seoul.go.kr:8088";
    this.apiKey = process.env.SEOUL_API_KEY || "47464b765073696c33366142537a7a";
    
    // POI001 ~ POI128 생성
    this.areaCodes = this.generateAreaCodes();
    
    // 마지막 히스토리 저장 시간 (초기값: 간격만큼 전으로 설정하여 즉시 저장)
    this.lastHistorySaved = Date.now() - this.historyInterval;
    
    // 에러 추적 (실패한 POI 코드와 실패 횟수)
    this.failedAreas = new Map();
    this.noDataWarningCount = 0;
    
    console.log(`📊 CrowdService 초기화: ${this.areaCodes.length}개 지역, 히스토리 주기: ${this.historyInterval/1000}초`);
    
    // 폴링은 자동 시작하지 않음 (server.js에서 수동 시작)
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
    
    if (shouldSaveHistory) {
      console.log(`\n📝 MongoDB 히스토리 저장 시작 (총 ${this.areaCodes.length}개 지역)`);
    }
    
    // 에러 카운터 초기화
    let successCount = 0;
    let failCount = 0;
    const failedAreas = [];
    this.noDataWarningCount = 0; // 데이터 없음 카운트 리셋
    
    // 모든 지역 데이터 가져오기
    for (const areaCode of this.areaCodes) {
      try {
        await this.fetchAndCacheOne(areaCode, shouldSaveHistory);
        if (shouldSaveHistory) successCount++;
        // 성공 시 실패 기록 제거
        this.failedAreas.delete(areaCode);
      } catch (e) {
        failCount++;
        failedAreas.push(areaCode);
        
        // 실패 횟수 증가
        const prevFailCount = this.failedAreas.get(areaCode) || 0;
        this.failedAreas.set(areaCode, prevFailCount + 1);
      }
    }
    
    // 에러 요약 출력 (개별 에러 대신)
    if (failCount > 0) {
      console.log(`⚠️  API 호출 실패: ${failCount}개 지역 (${failedAreas.slice(0, 5).join(', ')}${failCount > 5 ? '...' : ''})`);
    }
    
    // 데이터 없음 경고 요약
    if (this.noDataWarningCount > 0) {
      console.log(`ℹ️  데이터 없는 응답: ${this.noDataWarningCount}건`);
    }
    
    // 히스토리 저장 완료 후 시간 업데이트
    if (shouldSaveHistory) {
      this.lastHistorySaved = now;
      console.log(`✅ 히스토리 저장 완료: ${successCount}/${this.areaCodes.length}개 지역\n`);
    }
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
      
      // 디버깅: 첫 번째 저장 시 상세 정보
      if (payload.areaCode === 'POI001' && !this._firstSaveLogged) {
        console.log('\n🔍 [DEBUG] 첫 MongoDB 저장:');
        console.log('  - 지역:', payload.areaInfo?.areaName);
        console.log('  - 인구수:', peopleCount, '명');
        console.log('  - 혼잡도:', congestionLevel);
        this._firstSaveLogged = true;
      }
      
      // MongoDB에 저장
      const saved = await CrowdHistory.create({
        areaCode: payload.areaCode,
        areaName: payload.areaInfo?.areaName || payload.areaCode,
        category: payload.areaInfo?.category || '기타',
        peopleCount,
        congestionLevel,
        timestamp: new Date()
      });
      
      // 성공 로그 (처음 몇 개만)
      if (payload.areaCode === 'POI001' || payload.areaCode === 'POI002') {
        console.log(`💾 히스토리 저장: ${payload.areaCode} - ${peopleCount}명 (레벨 ${congestionLevel})`);
      }
    } catch (error) {
      // 히스토리 저장 실패해도 메인 기능에 영향 없도록 에러만 로그
      console.error(`❌ 히스토리 저장 실패 (${payload.areaCode}):`, error.message);
      console.error('   스택:', error.stack);
    }
  }

  /**
   * API 응답에서 인구수 추출
   */
  extractPeopleCount(apiData) {
    try {
      // 실제 API 응답 구조: SeoulRtd.citydata_ppltn
      const ppltnArray = apiData?.['SeoulRtd.citydata_ppltn'];
      
      if (!ppltnArray || !Array.isArray(ppltnArray) || ppltnArray.length === 0) {
        // 데이터 없음 경고는 카운트만 증가 (너무 많은 로그 방지)
        this.noDataWarningCount++;
        return 0;
      }
      
      const data = ppltnArray[0];
      
      // MIN과 MAX의 평균값 사용
      const minPop = parseInt(data.AREA_PPLTN_MIN) || 0;
      const maxPop = parseInt(data.AREA_PPLTN_MAX) || 0;
      
      if (minPop > 0 && maxPop > 0) {
        return Math.floor((minPop + maxPop) / 2); // 평균: (6000+6500)/2 = 6250
      }
      
      return minPop || maxPop || 0;
      
    } catch (error) {
      // 중요한 에러만 로그 출력
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ 인구수 추출 에러:', error.message);
      }
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

    // 시계열 데이터 변환: [timestamp, peopleCount, congestionLevel]
    const timeseries = history.map(h => ({
      timestamp: h.timestamp,
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
