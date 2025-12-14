// 지하철 혼잡도 비즈니스 로직 (DynamoDB 기반)
const axios = require("axios");
const { getRedisClient } = require("../utils/redisClient");
const areaMapping = require("../utils/areaMapping");

class SubwayService {
  constructor() {
    this.redis = getRedisClient();
    this.ttlSeconds = 60*10; // 10분 TTL
    this.baseUrl = process.env.SEOUL_POPULATION_API_URL || "http://openapi.seoul.go.kr:8088";
    this.apiKey = process.env.SEOUL_API_KEY || "47464b765073696c33366142537a7a";
    
    // POI 코드 생성
    this.areaCodes = this.generateAreaCodes();
  }

  /**
   * Area 코드 생성
   */
  generateAreaCodes() {
    const codes = [];
    const allAreas = areaMapping.getAllAreas();
    allAreas.forEach(area => {
      codes.push(area.areaCode);
    });
    return codes.length > 0 ? codes : this.generateDefaultCodes();
  }

  generateDefaultCodes() {
    return Array.from({ length: 128 }, (_, i) => `POI${String(i + 1).padStart(3, "0")}`);
  }

  /**
   * 특정 지역의 지하철 데이터 가져오기 및 캐싱
   */
  async fetchAndCacheOne(areaCode) {
    const url = `${this.baseUrl}/${this.apiKey}/json/citydata/1/5/${areaCode}`;
    const cacheKey = `subway:${areaCode}`;
    
    try {
      const response = await axios.get(url, { responseType: "json", timeout: 8000 });
      
      const cityData = response.data?.CITYDATA;
      const subwayData = cityData?.LIVE_SUB_PPLTN;
      
      if (!subwayData) {
        return null;
      }

      const areaInfo = areaMapping.getAreaByCode(areaCode);
      
      const payload = {
        areaCode,
        areaInfo: areaInfo || null,
        subway: subwayData,
        fetchedAt: new Date().toISOString()
      };
      
      await this.redis.safeSetEx(cacheKey, this.ttlSeconds, JSON.stringify(payload));
      return payload;
    } catch (error) {
      const cached = await this.redis.safeGet(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (_) {}
      }
      return null;
    }
  }

  /**
   * 전체 지하철 혼잡도 조회 (병렬 처리 최적화)
   */
  async getSubwayData() {
    // 모든 지역 코드에 대해 병렬로 캐시 확인
    const cachePromises = this.areaCodes.map(async (areaCode) => {
      const cacheKey = `subway:${areaCode}`;
      const cached = await this.redis.safeGet(cacheKey);
      
      if (cached) {
        try {
          const data = JSON.parse(cached);
          if (data) return { areaCode, data, fromCache: true };
        } catch (_) {}
      }
      return { areaCode, fromCache: false };
    });
    
    const cacheResults = await Promise.all(cachePromises);
    const results = [];
    const toFetch = [];
    
    // 캐시된 데이터는 결과에 추가, 캐시 미스는 별도 배열에 추가
    cacheResults.forEach(({ areaCode, data, fromCache }) => {
      if (fromCache && data) {
        results.push(data);
      } else {
        toFetch.push(areaCode);
      }
    });
    
    // 캐시 미스인 지역들을 배치로 병렬 처리 (한 번에 최대 20개씩)
    const batchSize = 20;
    for (let i = 0; i < toFetch.length; i += batchSize) {
      const batch = toFetch.slice(i, i + batchSize);
      const fetchPromises = batch.map(async (areaCode) => {
      try {
        const fresh = await this.fetchAndCacheOne(areaCode);
          return fresh;
      } catch (e) {
          // 에러 발생 시 null 반환 (결과에 포함하지 않음)
          return null;
      }
      });
      
      const batchResults = await Promise.all(fetchPromises);
      results.push(...batchResults.filter(r => r !== null));
    }
    
    return results;
  }

  /**
   * 특정 지역의 지하철 혼잡도 조회
   */
  async getSubwayDataByAreaCode(areaCode) {
    if (!areaMapping.isValidAreaCode(areaCode)) {
      throw new Error(`유효하지 않은 지역 코드입니다: ${areaCode}`);
    }

    const cacheKey = `subway:${areaCode}`;
    const cached = await this.redis.safeGet(cacheKey);
    
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (_) {}
    }
    
    return await this.fetchAndCacheOne(areaCode);
  }
}

module.exports = new SubwayService();

