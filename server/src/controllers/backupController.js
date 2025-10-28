const s3BackupService = require('../services/s3BackupService');
const { successResponse, errorResponse } = require('../utils/errorHandler');

/**
 * @desc    S3 백업 목록 조회
 * @route   GET /api/backups
 * @access  Public (개발 환경에서는 인증 불필요)
 */
exports.listBackups = async (req, res) => {
  try {
    if (!s3BackupService.isEnabled()) {
      return res.status(400).json(
        errorResponse('S3 백업이 비활성화되어 있습니다. ENABLE_S3_BACKUP 환경변수를 확인하세요.')
      );
    }

    const backups = await s3BackupService.listBackups();
    
    res.json(successResponse({
      count: backups.length,
      backups
    }, '백업 목록을 성공적으로 조회했습니다.'));
  } catch (error) {
    console.error('백업 목록 조회 에러:', error);
    res.status(500).json(errorResponse('백업 목록 조회 중 오류가 발생했습니다.'));
  }
};

/**
 * @desc    수동 백업 트리거
 * @route   POST /api/backups/trigger
 * @access  Public (개발 환경에서는 인증 불필요)
 */
exports.triggerBackup = async (req, res) => {
  try {
    if (!s3BackupService.isEnabled()) {
      return res.status(400).json(
        errorResponse('S3 백업이 비활성화되어 있습니다. ENABLE_S3_BACKUP 환경변수를 확인하세요.')
      );
    }

    const result = await s3BackupService.backupCrowdHistory();
    
    if (result.success) {
      res.json(successResponse({
        count: result.count,
        s3Key: result.s3Key
      }, result.message));
    } else {
      res.status(500).json(errorResponse(result.message));
    }
  } catch (error) {
    console.error('백업 트리거 에러:', error);
    res.status(500).json(errorResponse('백업 실행 중 오류가 발생했습니다.'));
  }
};

/**
 * @desc    백업 상태 확인
 * @route   GET /api/backups/status
 * @access  Public
 */
exports.getBackupStatus = async (req, res) => {
  try {
    const enabled = s3BackupService.isEnabled();
    const backups = enabled ? await s3BackupService.listBackups() : [];
    
    res.json(successResponse({
      enabled,
      totalBackups: backups.length,
      latestBackup: backups.length > 0 ? backups[0] : null,
      s3Bucket: process.env.S3_BUCKET_NAME || 'crowdsense-data'
    }, '백업 상태를 성공적으로 조회했습니다.'));
  } catch (error) {
    console.error('백업 상태 조회 에러:', error);
    res.status(500).json(errorResponse('백업 상태 조회 중 오류가 발생했습니다.'));
  }
};

