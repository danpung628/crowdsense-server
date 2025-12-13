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
      const response = await axios.get(url, { responseType: "json", timeout: 10000 });
      
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
   * 전체 지하철 혼잡도 조회
   */
  async getSubwayData() {
    const results = [];
    
    for (const areaCode of this.areaCodes) {
      const cacheKey = `subway:${areaCode}`;
      const cached = await this.redis.safeGet(cacheKey);
      
      if (cached) {
        try {
          const data = JSON.parse(cached);
          if (data) results.push(data);
          continue;
        } catch (_) {}
      }
      
      try {
        const fresh = await this.fetchAndCacheOne(areaCode);
        if (fresh) results.push(fresh);
      } catch (e) {
        // 에러 로그만 찍고 계속 진행
      }
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

