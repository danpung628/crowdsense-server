const { putJsonToS3, listS3Objects } = require('../utils/s3Client');
const CrowdHistory = require('../models/CrowdHistory');

class S3BackupService {
  constructor() {
    this.backupInterval = 24 * 60 * 60 * 1000; // 24시간마다 백업
    this.enabled = process.env.ENABLE_S3_BACKUP === 'true';
    this.backupTimer = null;
  }

  /**
   * MongoDB → S3 일일 백업
   */
  async backupCrowdHistory() {
    if (!this.enabled) {
      console.log('⏭️  S3 백업 비활성화됨');
      return { success: false, message: 'S3 백업이 비활성화되어 있습니다.' };
    }

    try {
      console.log('📤 MongoDB → S3 백업 시작...');
      
      // 어제 날짜 계산
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date(yesterday);
      today.setDate(today.getDate() + 1);

      // 어제 데이터 조회
      const histories = await CrowdHistory.find({
        timestamp: { $gte: yesterday, $lt: today }
      }).lean();

      if (histories.length === 0) {
        console.log('ℹ️  백업할 데이터 없음');
        return { success: true, message: '백업할 데이터가 없습니다.', count: 0 };
      }

      // S3 저장
      const dateStr = yesterday.toISOString().split('T')[0];
      const s3Key = `backups/crowd-history/${dateStr}.json`;
      
      const backupData = {
        date: dateStr,
        count: histories.length,
        generatedAt: new Date().toISOString(),
        data: histories
      };

      const success = await putJsonToS3(s3Key, backupData);

      if (success) {
        console.log(`✅ 백업 완료: ${histories.length}건 → ${s3Key}`);
        return { 
          success: true, 
          message: '백업이 성공적으로 완료되었습니다.', 
          count: histories.length,
          s3Key 
        };
      } else {
        console.error('❌ S3 백업 실패');
        return { success: false, message: 'S3 업로드에 실패했습니다.' };
      }
    } catch (error) {
      console.error('❌ S3 백업 실패:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * 백업 스케줄러 시작
   */
  startBackupScheduler() {
    if (!this.enabled) {
      console.log('⏭️  S3 백업 스케줄러 비활성화됨 (ENABLE_S3_BACKUP=false)');
      return;
    }

    console.log('🔄 S3 백업 스케줄러 시작 (24시간 주기)');
    
    // 즉시 한 번 실행
    this.backupCrowdHistory();
    
    // 주기적 실행
    this.backupTimer = setInterval(() => {
      this.backupCrowdHistory();
    }, this.backupInterval);
  }

  /**
   * 백업 스케줄러 중지
   */
  stopBackupScheduler() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
      console.log('🛑 S3 백업 스케줄러 중지');
    }
  }

  /**
   * S3에 저장된 백업 목록 조회
   */
  async listBackups() {
    try {
      const objects = await listS3Objects('backups/crowd-history/');
      return objects.map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        date: obj.Key.split('/').pop().replace('.json', '')
      })).sort((a, b) => b.date.localeCompare(a.date)); // 최신순 정렬
    } catch (error) {
      console.error('❌ 백업 목록 조회 실패:', error.message);
      return [];
    }
  }

  /**
   * 백업 활성화 상태 확인
   */
  isEnabled() {
    return this.enabled;
  }
}

module.exports = new S3BackupService();

