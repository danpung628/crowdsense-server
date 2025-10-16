// 교통 혼잡도 비즈니스 로직
const { getRedisClient } = require("../utils/redisClient");

class TrafficService {
  constructor() {
    this.redis = getRedisClient();
    this.cacheKey = "traffic:all";
    this.ttlSeconds = 60;
  }

  async getTrafficData() {
    const cached = await this.redis.safeGet(this.cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (_) {}
    }

    const data = [
      { line: "2호선", station: "강남역", congestion: "매우혼잡", level: 5 },
      { line: "2호선", station: "홍대입구역", congestion: "혼잡", level: 4 },
      { line: "1호선", station: "서울역", congestion: "보통", level: 3 },
      { line: "3호선", station: "교대역", congestion: "여유", level: 2 },
    ];

    await this.redis.safeSetEx(this.cacheKey, this.ttlSeconds, JSON.stringify(data));
    return data;
  }
}

module.exports = new TrafficService();
