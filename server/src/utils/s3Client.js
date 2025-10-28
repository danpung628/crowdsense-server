const { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");

const S3_REGION = process.env.AWS_REGION || 'ap-northeast-2';
const S3_BUCKET = process.env.S3_BUCKET_NAME || 'crowdsense-data';

// S3 클라이언트 초기화
const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

/**
 * S3에서 JSON 파일 읽기
 * @param {string} key - S3 객체 키
 * @returns {Promise<Object|null>} 파싱된 JSON 객체 또는 null
 */
async function getJsonFromS3(key) {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key
    });
    
    const response = await s3Client.send(command);
    const bodyContents = await streamToString(response.Body);
    return JSON.parse(bodyContents);
  } catch (error) {
    console.error(`❌ S3 읽기 실패 (${key}):`, error.message);
    return null;
  }
}

/**
 * S3에 JSON 파일 쓰기
 * @param {string} key - S3 객체 키
 * @param {Object} data - 저장할 데이터
 * @returns {Promise<boolean>} 성공 여부
 */
async function putJsonToS3(key, data) {
  try {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json'
    });
    
    await s3Client.send(command);
    console.log(`✅ S3 저장 완료: ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ S3 저장 실패 (${key}):`, error.message);
    return false;
  }
}

/**
 * S3에 파일 업로드 (대용량 파일용)
 * @param {string} key - S3 객체 키
 * @param {Buffer|string} fileBuffer - 파일 데이터
 * @param {string} contentType - MIME 타입
 * @returns {Promise<boolean>} 성공 여부
 */
async function uploadToS3(key, fileBuffer, contentType = 'application/octet-stream') {
  try {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: S3_BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType
      }
    });

    await upload.done();
    console.log(`✅ S3 업로드 완료: ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ S3 업로드 실패 (${key}):`, error.message);
    return false;
  }
}

/**
 * Stream을 문자열로 변환
 * @param {ReadableStream} stream - 변환할 스트림
 * @returns {Promise<string>} 문자열 데이터
 */
function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

/**
 * S3 파일 목록 조회
 * @param {string} prefix - 검색할 접두사
 * @returns {Promise<Array>} S3 객체 목록
 */
async function listS3Objects(prefix) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: prefix
    });
    
    const response = await s3Client.send(command);
    return response.Contents || [];
  } catch (error) {
    console.error(`❌ S3 목록 조회 실패 (${prefix}):`, error.message);
    return [];
  }
}

module.exports = {
  s3Client,
  getJsonFromS3,
  putJsonToS3,
  uploadToS3,
  listS3Objects
};

