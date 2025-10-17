const testService = require("../services/testService");

// 전체 주차장 정보 조회
exports.getAllTest = async (req, res) => {
  try {
    const data = await testService.getTestData();

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
