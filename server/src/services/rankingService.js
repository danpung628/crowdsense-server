// 인기 장소 랭킹 서비스
const CrowdHistory = require('../models/CrowdHistory');

class RankingService {
  /**
   * 인기 장소 랭킹 조회
   */
  async getPopularPlaces(limit = 10, category = null, hours = 24) {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const matchStage = {
      timestamp: { $gte: startTime }
    };
    
    if (category) {
      matchStage.category = category;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$areaCode',
          areaName: { $first: '$areaName' },
          category: { $first: '$category' },
          avgPeople: { $avg: '$peopleCount' },
          maxPeople: { $max: '$peopleCount' },
          avgCongestion: { $avg: '$congestionLevel' }
        }
      },
      { $sort: { avgPeople: -1 } },
      { $limit: limit }
    ];

    const rankings = await CrowdHistory.aggregate(pipeline);

    return rankings.map((item, index) => ({
      rank: index + 1,
      areaCode: item._id,
      areaName: item.areaName,
      category: item.category,
      avgPeople: Math.round(item.avgPeople),
      maxPeople: item.maxPeople,
      avgCongestion: Math.round(item.avgCongestion * 10) / 10
    }));
  }
}

module.exports = new RankingService();

