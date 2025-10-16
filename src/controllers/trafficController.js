const trafficService = require("../services/trafficService");

// 전체 교통 혼잡도 조회
exports.getAllTraffic = async (req, res) => {
  try {
    const data = await trafficService.getTrafficData();

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
