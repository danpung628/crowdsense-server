const express = require("express");
const router = express.Router();
const trafficController = require("../controllers/trafficController");

// GET /api/traffic - 전체 교통 혼잡도 조회
router.get("/", trafficController.getAllTraffic);

module.exports = router;
