const express = require("express");
const router = express.Router();
const testController = require("../controllers/testController");

// GET /api/parking - 전체 주차장 정보 조회
router.get("/", testController.getAllTest);

module.exports = router;
