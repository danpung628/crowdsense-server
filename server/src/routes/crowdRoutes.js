const express = require("express");
const router = express.Router();
const crowdController = require("../controllers/crowdController");
const { authenticate } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /api/crowds:
 *   get:
 *     summary: 전체 인구 밀집도 조회 (필터링, 정렬, HATEOAS 지원)
 *     tags: [Crowds]
 *     security:
 *       - bearerAuth: []
 *     description: 서울시 전체 POI(관심지점)의 인구 밀집도 데이터를 조회합니다. 필터링, 정렬을 지원하며 HATEOAS 링크를 포함합니다. 모든 데이터를 자동으로 반환합니다.
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           example: 관광특구
 *         description: 카테고리 필터
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: areaCode
 *         description: 정렬 필드 (areaCode, areaInfo.areaName 등)
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
 *                           areaCode:
 *                             type: string
 *                             example: POI001
 *                           areaInfo:
 *                             type: object
 *                           data:
 *                             type: object
 *                           fetchedAt:
 *                             type: string
 *                             format: date-time
 *                     total:
 *                       type: integer
 *                       example: 128
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
 *                           example: /api/crowds
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
router.get("/", authenticate, crowdController.getAllCrowds);

/**
 * @swagger
 * /api/crowds/{areaCode}:
 *   get:
 *     summary: 특정 지역 인구 밀집도 조회 (HATEOAS 지원)
 *     tags: [Crowds]
 *     security:
 *       - bearerAuth: []
 *     description: 특정 POI 코드의 인구 밀집도 데이터를 조회합니다. HATEOAS 링크를 포함합니다.
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
 *                     data:
 *                       type: object
 *                       description: 서울시 도시데이터 API 응답
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
/**
 * @swagger
 * /api/crowds/{areaCode}/history:
 *   get:
 *     summary: 인파 변화 추이 조회 (HATEOAS 지원)
 *     tags: [Crowds]
 *     security:
 *       - bearerAuth: []
 *     description: 특정 지역의 인파 변화 히스토리와 통계를 조회합니다. HATEOAS 링크를 포함합니다.
 *     parameters:
 *       - in: path
 *         name: areaCode
 *         required: true
 *         schema:
 *           type: string
 *           example: POI001
 *         description: 지역 코드
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           default: 24
 *           example: 24
 *         description: 조회 기간 (시간)
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
 *                     areaName:
 *                       type: string
 *                       example: 강남 MICE 관광특구
 *                     period:
 *                       type: string
 *                       example: 최근 24시간
 *                     dataCount:
 *                       type: integer
 *                       example: 24
 *                     timeseries:
 *                       type: array
 *                       description: 시계열 데이터 (시간별 인구수와 혼잡도)
 *                       items:
 *                         type: object
 *                         properties:
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-10-26T13:31:53.553Z"
 *                           peopleCount:
 *                             type: integer
 *                             example: 6250
 *                           congestionLevel:
 *                             type: integer
 *                             example: 2
 *                     average:
 *                       type: object
 *                       description: 평균값
 *                       properties:
 *                         peopleCount:
 *                           type: integer
 *                           example: 7500
 *                         congestionLevel:
 *                           type: number
 *                           example: 2.5
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
router.get("/:areaCode/history", authenticate, crowdController.getCrowdHistory);

router.get("/:areaCode", authenticate, crowdController.getCrowdByAreaCode);

module.exports = router;
