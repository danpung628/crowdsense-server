const express = require("express");
const router = express.Router();
const parkingController = require("../controllers/parkingController");
const { authenticate } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /api/parking:
 *   get:
 *     summary: 전체 주차장 정보 조회 (필터링, 정렬, HATEOAS 지원)
 *     tags: [Parking]
 *     security:
 *       - bearerAuth: []
 *     description: 서울시 전체 주차장의 실시간 가용 정보를 조회합니다. 필터링, 정렬, HATEOAS 링크를 지원합니다. 모든 데이터를 자동으로 반환합니다.
 *     parameters:
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *           example: 강남구
 *         description: 자치구 필터
 *       - in: query
 *         name: available
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: 가용 주차면 필터 (true=가용, false=만차)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: available
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
 *                           parkingId:
 *                             type: string
 *                             example: P001
 *                           name:
 *                             type: string
 *                             example: 강남역 공영주차장
 *                           available:
 *                             type: integer
 *                             example: 45
 *                           total:
 *                             type: integer
 *                             example: 100
 *                           fee:
 *                             type: integer
 *                             example: 3000
 *                           address:
 *                             type: string
 *                             example: 서울시 강남구 역삼동
 *                           latitude:
 *                             type: number
 *                             example: 37.497942
 *                           longitude:
 *                             type: number
 *                             example: 127.027621
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     total:
 *                       type: integer
 *                       example: 500
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
 *                           example: /api/parking
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
 *     summary: 주변 주차장 추천 (HATEOAS 지원)
 *     tags: [Parking]
 *     security:
 *       - bearerAuth: []
 *     description: 좌표 기반으로 주변 주차장을 거리순으로 추천합니다. HATEOAS 링크를 포함합니다.
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
 * /api/parking/district/{district}:
 *   get:
 *     summary: 자치구별 주차장 정보 조회 (HATEOAS 지원)
 *     tags: [Parking]
 *     security:
 *       - bearerAuth: []
 *     description: 특정 자치구의 주차장 정보를 조회합니다. HATEOAS 링크를 포함합니다.
 *     parameters:
 *       - in: path
 *         name: district
 *         required: true
 *         schema:
 *           type: string
 *           enum: [강남구, 강동구, 강북구, 강서구, 관악구, 광진구, 구로구, 금천구, 노원구, 도봉구, 동대문구, 동작구, 마포구, 서대문구, 서초구, 성동구, 성북구, 송파구, 양천구, 영등포구, 용산구, 은평구, 종로구, 중구, 중랑구]
 *           example: 강남구
 *         description: 서울시 자치구 이름
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
 *                       district:
 *                         type: string
 *                       available:
 *                         type: integer
 *                       total:
 *                         type: integer
 *                       fee:
 *                         type: string
 *                       address:
 *                         type: string
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *                       operatingTime:
 *                         type: string
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: 유효하지 않은 자치구
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
router.get("/district/:district", authenticate, parkingController.getByDistrict);

module.exports = router;
