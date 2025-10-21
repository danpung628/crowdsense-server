const rankingService = require("../services/rankingService");
const { successResponse, errorResponse } = require("../utils/errorHandler");

// 인기 장소 랭킹 조회
exports.getPopularPlaces = async (req, res) => {
  try {
    const { limit, category, hours } = req.query;
    const data = await rankingService.getPopularPlaces(
      parseInt(limit) || 10,
      category || null,
      parseInt(hours) || 24
    );
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
};

