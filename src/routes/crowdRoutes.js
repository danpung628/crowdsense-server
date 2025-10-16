const express = require("express");
const router = express.Router();
const crowdController = require("../controllers/crowdController");

// GET /api/crowds - 전체 인파 조회
router.get("/", crowdController.getAllCrowds);

module.exports = router;
