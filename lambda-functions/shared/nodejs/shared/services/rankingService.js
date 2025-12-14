// 인기 장소 랭킹 서비스 (DynamoDB 기반)
const CrowdHistoryDynamo = require('../models/CrowdHistoryDynamo');

class RankingService {
  /**
   * 인기 장소 랭킹 조회
   */
  async getPopularPlaces(limit = 10, category = null, hours = 24) {
    const rankings = await CrowdHistoryDynamo.getRankings(hours, category, limit);

    return rankings.map((item, index) => ({
      rank: index + 1,
      areaCode: item.areaCode,
      areaName: item.areaName,
      category: item.category,
      avgPeople: item.avgPeople,
      maxPeople: item.maxPeople,
      avgCongestion: item.avgCongestion
    }));
  }
}

module.exports = new RankingService();

