// 실제 비즈니스 로직
const axios = require("axios");
const { getRedisClient } = require("../utils/redisClient");

class TestService {
  constructor() {
    this.redis = getRedisClient();
    this.ttlSeconds = 60; // 60초 TTL
    this.pollingInterval = 60 * 1000; // 1분마다 갱신
    this.baseUrl = "http://openapi.seoul.go.kr:8088/47464b765073696c33366142537a7a/JSON/citydata_ppltn/1/5/POI";
    this.areaCodes = Array.from({ length: 128 }, (_, i) => String(i + 1).padStart(3, "0"));
    this.startPolling();
  }

  startPolling() {
    console.log("⏱ OpenAPI polling started (every 60s, areaCode 001~128)");
    // 초기 1회 즉시 수행
    this.fetchAllAreaCodes().catch((err) => console.error("Polling init failed:", err));
    // 주기적 수행
    setInterval(() => {
      this.fetchAllAreaCodes().catch((err) => console.error("Polling failed:", err));
    }, this.pollingInterval);
  }

  async fetchAllAreaCodes() {
    for (const areaCode of this.areaCodes) {
      await this.fetchAndCacheOne(areaCode).catch((e) => {
        console.error(`Fetch failed for areaCode=${areaCode}:`, e.message);
      });
    }
  }

  async fetchAndCacheOne(areaCode) {
    const url = `${this.baseUrl}${areaCode}`;
    const cacheKey = `openapi:seoul:citydata_ppltn:POI${areaCode}`;
    try {
      const response = await axios.get(url, { responseType: "json", timeout: 10000 });
      const payload = { data: response.data, fetchedAt: new Date().toISOString(), areaCode };
      await this.redis.safeSetEx(cacheKey, this.ttlSeconds, JSON.stringify(payload));
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

  async getTestData() {
    // 전체 areaCode의 캐시 값을 모아 반환. 미스 시 해당 코드만 즉시 fetch
    const results = [];
    for (const areaCode of this.areaCodes) {
      const cacheKey = `openapi:seoul:citydata_ppltn:POI${areaCode}`;
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
        results.push({ error: e.message, areaCode });
      }
    }
    return results;
  }
}

module.exports = new TestService();

