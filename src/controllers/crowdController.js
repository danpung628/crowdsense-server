const crowdService = require("../services/crowdService");

// 전체 인파 정보 조회
exports.getAllCrowds = async (req, res) => {
  try {
    const data = await crowdService.getCrowdData();

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
