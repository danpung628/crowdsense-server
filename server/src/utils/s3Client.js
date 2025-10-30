/**
 * AWS S3 클라이언트 유틸리티
 * 로컬/EC2 환경에 따라 다른 인증 방식 사용
 */

const { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

class S3Service {
  constructor() {
    this.region = process.env.AWS_REGION || 'ap-northeast-2';
    this.bucketName = process.env.AWS_S3_BUCKET_NAME;
    this.environmentMode = process.env.ENVIRONMENT_MODE || 'local';
    
    // S3 클라이언트 초기화
    this.initializeS3Client();
  }

  initializeS3Client() {
    const s3Config = {
      region: this.region
    };

    // 로컬 환경에서는 Access Key 사용, EC2에서는 IAM 역할 사용
    if (this.environmentMode === 'local') {
      s3Config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      };
    }
    // EC2 환경에서는 IAM 역할이 자동으로 사용됨 (credentials 설정 불필요)

    this.s3Client = new S3Client(s3Config);
    
    console.log(`🔧 S3 클라이언트 초기화 완료 (${this.environmentMode} 모드)`);
    if (this.bucketName) {
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
    return this.environmentMode === 'ec2' && this.bucketName && this.s3Client;
  }

  /**
   * S3에서 JSON 파일 다운로드
   */
  async downloadJsonFile(key, localPath) {
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
      
      // 로컬에도 저장
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(localPath, data, 'utf-8');
      console.log(`✅ S3 파일 다운로드 완료: ${localPath}`);
      
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
  async uploadJsonFile(key, localPath, data) {
    if (!this.isS3Available()) {
      console.log('⚠️ S3를 사용할 수 없어 로컬에만 저장합니다');
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
      
      // 로컬에도 저장
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(localPath, jsonData, 'utf-8');
      console.log(`✅ S3 파일 업로드 완료: ${key}`);
    } catch (error) {
      console.error(`❌ S3 업로드 실패 (${key}):`, error.message);
      // S3 실패해도 로컬 저장은 유지
      const jsonData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      fs.writeFileSync(localPath, jsonData, 'utf-8');
      console.log(`💾 로컬에만 저장 완료: ${localPath}`);
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
