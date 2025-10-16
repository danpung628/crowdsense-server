const express = require("express");
const router = express.Router();
const parkingController = require("../controllers/parkingController");

// GET /api/parking - 전체 주차장 정보 조회
router.get("/", parkingController.getAllParking);

module.exports = router;
