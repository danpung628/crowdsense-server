// 실제 비즈니스 로직
const { getRedisClient } = require("../utils/redisClient");

class CrowdService {
  constructor() {
    this.redis = getRedisClient();
    this.cacheKey = "crowds:all";
    // 기본 TTL 60초 (공공데이터 마비 상황 고려, 필요 시 조정)
    this.ttlSeconds = 60;
  }

  async getCrowdData() {
    // 1) 캐시 조회
    const cached = await this.redis.safeGet(this.cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (_) {
        // JSON 파싱 실패 시 캐시 무시하고 재생성
      }
    }

    // 2) 데이터 생성 (현재는 임시 데이터 or 공공API 자리)
    const data = [
      { location: "강남역", congestion: "높음", people: 5000 },
      { location: "홍대입구역", congestion: "보통", people: 3000 },
      { location: "명동", congestion: "낮음", people: 1500 },
    ];

    // 3) 캐시에 저장 (에러는 무시하고 계속 진행)
    await this.redis.safeSetEx(this.cacheKey, this.ttlSeconds, JSON.stringify(data));

    return data;
  }
}

module.exports = new CrowdService();
