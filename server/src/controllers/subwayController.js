const subwayService = require("../services/subwayService");
const { successResponse, errorResponse } = require("../utils/errorHandler");

// 전체 지하철 혼잡도 조회
exports.getAllSubway = async (req, res) => {
  try {
    const data = await subwayService.getSubwayData();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
};

// 특정 지역의 지하철 혼잡도 조회
exports.getSubwayByAreaCode = async (req, res) => {
  try {
    const { areaCode } = req.params;
    const data = await subwayService.getSubwayDataByAreaCode(areaCode);
    res.json(successResponse(data));
  } catch (error) {
    const statusCode = error.message.includes('유효하지 않은') ? 404 : 500;
    res.status(statusCode).json(errorResponse(error));
  }
};


