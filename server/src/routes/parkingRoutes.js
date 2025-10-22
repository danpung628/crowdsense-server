const express = require("express");
const router = express.Router();
const parkingController = require("../controllers/parkingController");
const { authenticate } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /api/parking:
 *   get:
 *     summary: 전체 주차장 정보 조회
 *     tags: [Parking]
 *     security:
 *       - bearerAuth: []
 *     description: 서울시 전체 주차장의 실시간 가용 정보를 조회합니다.
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
 *                       parkingId:
 *                         type: string
 *                         example: P001
 *                       name:
 *                         type: string
 *                         example: 강남역 공영주차장
 *                       available:
 *                         type: integer
 *                         example: 45
 *                       total:
 *                         type: integer
 *                         example: 100
 *                       fee:
 *                         type: integer
 *                         example: 3000
 *                       address:
 *                         type: string
 *                         example: 서울시 강남구 역삼동
 *                       latitude:
 *                         type: number
 *                         example: 37.497942
 *                       longitude:
 *                         type: number
 *                         example: 127.027621
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
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
router.get("/", authenticate, parkingController.getAllParking);

/**
 * @swagger
 * /api/parking/nearby:
 *   get:
 *     summary: 주변 주차장 추천
 *     tags: [Parking]
 *     security:
 *       - bearerAuth: []
 *     description: 좌표 기반으로 주변 주차장을 거리순으로 추천합니다.
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *           example: 37.4979
 *         description: 위도
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *           example: 127.0276
 *         description: 경도
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 1
 *           example: 1
 *         description: 검색 반경 (km)
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
 *                       parkingId:
 *                         type: string
 *                       name:
 *                         type: string
 *                       available:
 *                         type: integer
 *                       total:
 *                         type: integer
 *                       distance:
 *                         type: number
 *                         example: 0.5
 *                         description: 거리 (km)
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: 잘못된 요청
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
router.get("/nearby", authenticate, parkingController.getNearbyParking);

/**
 * @swagger
 * /api/parking/{parkingId}:
 *   get:
 *     summary: 특정 주차장 정보 조회
 *     tags: [Parking]
 *     security:
 *       - bearerAuth: []
 *     description: 특정 주차장의 실시간 가용 정보를 조회합니다.
 *     parameters:
 *       - in: path
 *         name: parkingId
 *         required: true
 *         schema:
 *           type: string
 *           example: P001
 *         description: 주차장 ID
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
 *                     parkingId:
 *                       type: string
 *                       example: P001
 *                     name:
 *                       type: string
 *                       example: 강남역 공영주차장
 *                     available:
 *                       type: integer
 *                       example: 45
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     fee:
 *                       type: integer
 *                       example: 3000
 *                     address:
 *                       type: string
 *                       example: 서울시 강남구 역삼동
 *                     latitude:
 *                       type: number
 *                       example: 37.497942
 *                     longitude:
 *                       type: number
 *                       example: 127.027621
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 주차장을 찾을 수 없음
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
router.get("/:parkingId", authenticate, parkingController.getParkingById);

module.exports = router;
