const express = require("express");
const router = express.Router();
const areaController = require("../controllers/areaController");
const { authenticate } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /api/areas:
 *   get:
 *     summary: 전체 지역 코드 조회 (HATEOAS 지원)
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     description: 서울시 전체 POI 지역 코드와 이름 매핑 정보를 조회합니다. HATEOAS 링크를 지원하며 모든 데이터를 자동으로 반환합니다.
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
 *                           category:
 *                             type: string
 *                             example: 관광특구
 *                           no:
 *                             type: integer
 *                             example: 1
 *                           areaCode:
 *                             type: string
 *                             example: POI001
 *                           areaName:
 *                             type: string
 *                             example: 강남 MICE 관광특구
 *                           engName:
 *                             type: string
 *                             example: Gangnam MICE Special Tourist Zone
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
 *                           example: /api/areas
 *                     categories:
 *                       type: object
 *                       properties:
 *                         href:
 *                           type: string
 *                           example: /api/areas/categories
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
router.get("/", authenticate, areaController.getAllAreas);

/**
 * @swagger
 * /api/areas/categories:
 *   get:
 *     summary: 카테고리 목록 조회 (HATEOAS 지원)
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     description: 전체 지역 카테고리 목록을 조회합니다. HATEOAS 링크를 포함합니다.
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
 *                     type: string
 *                   example: ["관광특구", "고궁·문화유산", "인구밀집지역", "발달상권", "공원"]
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
router.get("/categories", authenticate, areaController.getCategories);

/**
 * @swagger
 * /api/areas/search:
 *   get:
 *     summary: 지역명 검색 (HATEOAS 지원)
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     description: 지역명(한글/영문)으로 검색합니다. HATEOAS 링크를 포함합니다.
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           example: 강남
 *         description: 검색어
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
 *                       category:
 *                         type: string
 *                       areaCode:
 *                         type: string
 *                       areaName:
 *                         type: string
 *                       engName:
 *                         type: string
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: 잘못된 요청 (검색어 없음)
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
router.get("/search", authenticate, areaController.searchAreas);

/**
 * @swagger
 * /api/areas/category/{category}:
 *   get:
 *     summary: 카테고리별 지역 조회 (HATEOAS 지원)
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     description: 특정 카테고리에 속하는 지역들을 조회합니다. HATEOAS 링크를 포함합니다.
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           example: 관광특구
 *         description: 카테고리명
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
 *                       category:
 *                         type: string
 *                       areaCode:
 *                         type: string
 *                       areaName:
 *                         type: string
 *                       engName:
 *                         type: string
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
router.get("/category/:category", authenticate, areaController.getAreasByCategory);

/**
 * @swagger
 * /api/areas/{areaCode}:
 *   get:
 *     summary: 특정 지역 정보 조회 (HATEOAS 지원)
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     description: 특정 POI 코드의 상세 정보를 조회합니다. HATEOAS 링크를 포함합니다.
 *     parameters:
 *       - in: path
 *         name: areaCode
 *         required: true
 *         schema:
 *           type: string
 *           example: POI001
 *         description: 지역 코드
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
 *                     category:
 *                       type: string
 *                       example: 관광특구
 *                     no:
 *                       type: integer
 *                       example: 1
 *                     areaCode:
 *                       type: string
 *                       example: POI001
 *                     areaName:
 *                       type: string
 *                       example: 강남 MICE 관광특구
 *                     engName:
 *                       type: string
 *                       example: Gangnam MICE Special Tourist Zone
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
router.get("/:areaCode", authenticate, areaController.getAreaByCode);

module.exports = router;


