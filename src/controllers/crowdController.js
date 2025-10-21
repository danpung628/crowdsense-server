const crowdService = require("../services/crowdService");
const { successResponse, errorResponse } = require("../utils/errorHandler");

// 전체 인구 밀집도 조회
exports.getAllCrowds = async (req, res) => {
  try {
    const data = await crowdService.getCrowdData();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
};

// 특정 지역의 인구 밀집도 조회
exports.getCrowdByAreaCode = async (req, res) => {
  try {
    const { areaCode } = req.params;
    const data = await crowdService.getCrowdDataByAreaCode(areaCode);
    res.json(successResponse(data));
  } catch (error) {
    const statusCode = error.message.includes('유효하지 않은') ? 404 : 500;
    res.status(statusCode).json(errorResponse(error));
  }
};

// 인파 변화 추이 조회 (히스토리)
exports.getCrowdHistory = async (req, res) => {
  try {
    const { areaCode } = req.params;
    const { hours } = req.query;
    const data = await crowdService.getCrowdHistory(areaCode, parseInt(hours) || 24);
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
};
