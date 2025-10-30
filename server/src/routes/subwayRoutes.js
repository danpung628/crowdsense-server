const express = require("express");
const router = express.Router();
const subwayController = require("../controllers/subwayController");
const { authenticate } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /api/subway:
 *   get:
 *     summary: 전체 지하철 혼잡도 조회 (정렬, HATEOAS 지원)
 *     tags: [Subway]
 *     security:
 *       - bearerAuth: []
 *     description: 서울시 전체 지하철역의 실시간 혼잡도 데이터를 조회합니다. 정렬, HATEOAS 링크를 지원합니다. 모든 데이터를 자동으로 반환합니다.
 *     parameters:
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: 정렬 필드
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: 정렬 순서
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
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           stationId:
 *                             type: string
 *                             example: S001
 *                           stationName:
 *                             type: string
 *                             example: 강남역
 *                           line:
 *                             type: string
 *                             example: 2호선
 *                           congestion:
 *                             type: string
 *                             example: 매우혼잡
 *                           level:
 *                             type: integer
 *                             example: 5
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     total:
 *                       type: integer
 *                       example: 150
 *                       description: 전체 항목 수
 *                 _links:
 *                   type: object
 *                   description: HATEOAS 링크
 *                   properties:
 *                     self:
 *                       type: object
 *                       properties:
 *                         href:
 *                           type: string
 *                           example: /api/subway
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
router.get("/", authenticate, subwayController.getAllSubway);

/**
 * @swagger
 * /api/subway/{areaCode}:
 *   get:
 *     summary: 특정 지역 지하철 혼잡도 조회 (HATEOAS 지원)
 *     tags: [Subway]
 *     security:
 *       - bearerAuth: []
 *     description: 특정 POI 코드의 지하철 혼잡도 데이터를 조회합니다. HATEOAS 링크를 포함합니다.
 *     parameters:
 *       - in: path
 *         name: areaCode
 *         required: true
 *         schema:
 *           type: string
 *           example: POI001
 *         description: 지역 코드 (POI001 ~ POI128)
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
 *                   type: object
 *                   properties:
 *                     areaCode:
 *                       type: string
 *                       example: POI001
 *                     areaInfo:
 *                       type: object
 *                     subway:
 *                       type: object
 *                       description: LIVE_SUB_PPLTN 데이터
 *                     fetchedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 지역 코드를 찾을 수 없음
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
router.get("/:areaCode", authenticate, subwayController.getSubwayByAreaCode);

module.exports = router;


