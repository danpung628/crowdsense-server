// 주차장 정보 비즈니스 로직
const { getRedisClient } = require("../utils/redisClient");

class ParkingService {
  constructor() {
    this.redis = getRedisClient();
    this.cacheKey = "parking:all";
    this.ttlSeconds = 60;
  }

  async getParkingData() {
    const cached = await this.redis.safeGet(this.cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (_) {}
    }

    const data = [
      { name: "강남역 공영주차장", available: 45, total: 100, fee: 3000 },
      { name: "홍대 공영주차장", available: 12, total: 80, fee: 2500 },
      { name: "명동 공영주차장", available: 5, total: 60, fee: 4000 },
      { name: "서울역 주차장", available: 0, total: 120, fee: 3500 },
    ];

    await this.redis.safeSetEx(this.cacheKey, this.ttlSeconds, JSON.stringify(data));
    return data;
  }
}

module.exports = new ParkingService();
