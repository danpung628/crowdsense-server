const express = require("express");
const router = express.Router();
const rankingController = require("../controllers/rankingController");
const { authenticate } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /api/rankings/popular:
 *   get:
 *     summary: 인기 장소 랭킹 조회
 *     tags: [Rankings]
 *     security:
 *       - bearerAuth: []
 *     description: 평균 인구수 기준 인기 장소 랭킹을 조회합니다.
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           example: 10
 *         description: 조회할 랭킹 개수
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           example: 관광특구
 *         description: 카테고리 필터 (선택)
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           default: 24
 *           example: 24
 *         description: 집계 기간 (시간)
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rank:
 *                         type: integer
 *                         example: 1
 *                       areaCode:
 *                         type: string
 *                         example: POI001
 *                       areaName:
 *                         type: string
 *                         example: 강남 MICE 관광특구
 *                       category:
 *                         type: string
 *                         example: 관광특구
 *                       avgPeople:
 *                         type: number
 *                         example: 8500
 *                       maxPeople:
 *                         type: number
 *                         example: 12000
 *                       avgCongestion:
 *                         type: number
 *                         example: 4.5
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/popular", authenticate, rankingController.getPopularPlaces);

module.exports = router;

