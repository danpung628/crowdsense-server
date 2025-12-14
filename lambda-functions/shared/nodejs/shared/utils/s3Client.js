/**
 * AWS S3 클라이언트 유틸리티 (Lambda용)
 * Lambda 환경에서는 IAM 역할을 통해 자동 인증
 */

const { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

class S3Service {
  constructor() {
    this.region = process.env.AWS_REGION || 'ap-northeast-2';
    this.bucketName = process.env.AWS_S3_BUCKET_NAME;
    
    // Lambda 환경에서는 IAM 역할 사용 (자동 인증)
    this.s3Client = new S3Client({ 
      region: this.region
      // credentials는 IAM 역할에서 자동으로 가져옴
    });
    
    if (this.bucketName) {
      console.log(`🔧 S3 클라이언트 초기화 완료 (Lambda)`);
      console.log(`   - 버킷: ${this.bucketName}`);
      console.log(`   - 리전: ${this.region}`);
    } else {
      console.log('   ⚠️ S3 버킷명이 설정되지 않았습니다');
    }
  }

  /**
   * S3 사용 가능 여부 확인
   */
  isS3Available() {
    return !!this.bucketName && !!this.s3Client;
  }

  /**
   * S3에서 JSON 파일 다운로드
   */
  async downloadJsonFile(key, localPath = null) {
    if (!this.isS3Available()) {
      throw new Error('S3가 사용 가능하지 않습니다');
    }

    try {
      console.log(`📥 S3에서 파일 다운로드: ${key}`);
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const response = await this.s3Client.send(command);
      const data = await this.streamToString(response.Body);
      
      // 로컬 경로가 제공된 경우에만 파일 저장 (Lambda에서는 보통 메모리만 사용)
      if (localPath) {
        const fs = require('fs');
        const path = require('path');
        const dir = path.dirname(localPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(localPath, data, 'utf-8');
        console.log(`✅ S3 파일 다운로드 완료: ${localPath}`);
      }
      
      return JSON.parse(data);
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        console.log(`📝 S3에 파일이 없습니다: ${key}`);
        return null;
      }
      console.error(`❌ S3 다운로드 실패 (${key}):`, error.message);
      throw error;
    }
  }

  /**
   * S3에 JSON 파일 업로드
   */
  async uploadJsonFile(key, localPath = null, data) {
    if (!this.isS3Available()) {
      console.log('⚠️ S3를 사용할 수 없어 업로드를 건너뜁니다');
      return;
    }

    try {
      console.log(`📤 S3에 파일 업로드: ${key}`);
      
      const jsonData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: jsonData,
        ContentType: 'application/json'
      });

      await this.s3Client.send(command);
      console.log(`✅ S3 파일 업로드 완료: ${key}`);
      
      // 로컬 경로가 제공된 경우에만 파일 저장
      if (localPath) {
        const fs = require('fs');
        const path = require('path');
        const dir = path.dirname(localPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(localPath, jsonData, 'utf-8');
      }
    } catch (error) {
      console.error(`❌ S3 업로드 실패 (${key}):`, error.message);
      throw error;
    }
  }

  /**
   * S3에서 파일 존재 여부 확인
   */
  async fileExists(key) {
    if (!this.isS3Available()) {
      return false;
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });
      
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.name === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Stream을 문자열로 변환
   */
  async streamToString(stream) {
    const chunks = [];
    return new Promise((resolve, reject) => {
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
  }
}

// 싱글톤 패턴
let s3ServiceInstance;

function getS3Service() {
  if (!s3ServiceInstance) {
    s3ServiceInstance = new S3Service();
  }
  return s3ServiceInstance;
}

module.exports = {
  getS3Service,
  S3Service
};

