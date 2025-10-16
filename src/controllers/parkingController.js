const parkingService = require("../services/parkingService");

// 전체 주차장 정보 조회
exports.getAllParking = async (req, res) => {
  try {
    const data = await parkingService.getParkingData();

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
