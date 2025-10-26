const parkingService = require("../services/parkingService");
const { successResponse, errorResponse } = require("../utils/errorHandler");

// 전체 주차장 정보 조회
exports.getAllParking = async (req, res) => {
  try {
    const data = await parkingService.getParkingData();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
};

// 자치구별 주차장 정보 조회
exports.getByDistrict = async (req, res) => {
  try {
    const { district } = req.params;
    const data = await parkingService.getParkingByDistrict(district);
    res.json(successResponse(data));
  } catch (error) {
    const statusCode = error.message.includes('유효하지 않은') ? 400 : 500;
    res.status(statusCode).json(errorResponse(error));
  }
};

// 주변 주차장 추천
exports.getNearbyParking = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json(errorResponse({
        message: '위도(lat)와 경도(lng)가 필요합니다.'
      }));
    }
    
    const data = await parkingService.findNearbyParking(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius) || 1
    );
    
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
};
