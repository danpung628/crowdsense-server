const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');

/**
 * @swagger
 * tags:
 *   name: Backups
 *   description: S3 백업 관리 API
 */

/**
 * @swagger
 * /api/backups:
 *   get:
 *     summary: S3 백업 목록 조회
 *     tags: [Backups]
 *     description: S3에 저장된 CrowdHistory 백업 파일 목록을 조회합니다.
 *     responses:
 *       200:
 *         description: 백업 목록 조회 성공
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
 *                     count:
 *                       type: integer
 *                       example: 5
 *                     backups:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           key:
 *                             type: string
 *                             example: "backups/crowd-history/2025-10-27.json"
 *                           size:
 *                             type: integer
 *                             example: 1024000
 *                           lastModified:
 *                             type: string
 *                             format: date-time
 *                           date:
 *                             type: string
 *                             example: "2025-10-27"
 *                 message:
 *                   type: string
 *                   example: "백업 목록을 성공적으로 조회했습니다."
 *       400:
 *         description: S3 백업이 비활성화됨
 *       500:
 *         description: 서버 오류
 */
router.get('/', backupController.listBackups);

/**
 * @swagger
 * /api/backups/trigger:
 *   post:
 *     summary: 수동 백업 실행
 *     tags: [Backups]
 *     description: 어제 날짜의 CrowdHistory 데이터를 S3에 백업합니다.
 *     responses:
 *       200:
 *         description: 백업 실행 성공
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
 *                     count:
 *                       type: integer
 *                       example: 1280
 *                     s3Key:
 *                       type: string
 *                       example: "backups/crowd-history/2025-10-27.json"
 *                 message:
 *                   type: string
 *                   example: "백업이 성공적으로 완료되었습니다."
 *       400:
 *         description: S3 백업이 비활성화됨
 *       500:
 *         description: 서버 오류
 */
router.post('/trigger', backupController.triggerBackup);

/**
 * @swagger
 * /api/backups/status:
 *   get:
 *     summary: 백업 상태 확인
 *     tags: [Backups]
 *     description: S3 백업 활성화 상태 및 최신 백업 정보를 조회합니다.
 *     responses:
 *       200:
 *         description: 백업 상태 조회 성공
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
 *                     enabled:
 *                       type: boolean
 *                       example: true
 *                     totalBackups:
 *                       type: integer
 *                       example: 5
 *                     latestBackup:
 *                       type: object
 *                       properties:
 *                         key:
 *                           type: string
 *                         size:
 *                           type: integer
 *                         lastModified:
 *                           type: string
 *                           format: date-time
 *                         date:
 *                           type: string
 *                     s3Bucket:
 *                       type: string
 *                       example: "crowdsense-data"
 *                 message:
 *                   type: string
 *       500:
 *         description: 서버 오류
 */
router.get('/status', backupController.getBackupStatus);

module.exports = router;

