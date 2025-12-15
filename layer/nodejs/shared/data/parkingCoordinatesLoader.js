/**
 * 주차장 좌표 로더 및 생성기 (Lambda용)
 * Lambda Layer에서는 파일 시스템 접근이 제한적이므로,
 * S3 또는 Layer 내부 파일 사용
 */

const fs = require('fs');
const path = require('path');
const { getS3Service } = require('../utils/s3Client');

const COORDS_FILE = path.join(__dirname, 'parkingCoordinates.json');
const S3_KEY = 'data/parkingCoordinates.json';

/**
 * 주차장 좌표 파일 로드
 */
async function loadCoordinates() {
  const s3Service = getS3Service();
  
  // S3에서 먼저 로드 시도
  if (s3Service.isS3Available()) {
    try {
      console.log('📡 S3에서 주차장 좌표 로드 시도...');
      const coords = await s3Service.downloadJsonFile(S3_KEY);
      if (coords) {
        console.log(`📂 S3에서 주차장 좌표 로드: ${Object.keys(coords).length}개`);
        return coords;
      }
    } catch (error) {
      console.log('⚠️ S3 로드 실패, Layer 파일 시도...');
    }
  }
  
  // Lambda Layer 내부 파일에서 로드
  const possiblePaths = [
    COORDS_FILE,
    path.join('/opt', 'data', 'parkingCoordinates.json'), // Lambda Layer 경로
    path.join(__dirname, '../../../../src/data/parkingCoordinates.json')
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf-8');
        const coords = JSON.parse(data);
        console.log(`📂 Layer에서 주차장 좌표 로드: ${Object.keys(coords).length}개`);
        return coords;
      } catch (error) {
        console.error(`주차장 좌표 파일 로드 실패 (${filePath}):`, error.message);
      }
    }
  }
  
  console.log('📁 주차장 좌표 파일을 찾을 수 없습니다');
  return null;
}

/**
 * 동기 버전 (기존 호환성 유지)
 */
function loadCoordinatesSync() {
  const possiblePaths = [
    COORDS_FILE,
    path.join('/opt', 'data', 'parkingCoordinates.json'),
    path.join(__dirname, '../../../../src/data/parkingCoordinates.json')
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf-8');
        const coords = JSON.parse(data);
        console.log(`📂 주차장 좌표 로드 (동기): ${Object.keys(coords).length}개`);
        return coords;
      } catch (error) {
        console.error(`주차장 좌표 파일 로드 실패:`, error.message);
      }
    }
  }
  return null;
}

/**
 * 특정 주차장 좌표 조회
 */
async function getCoordinates(parkingId) {
  const coords = await loadCoordinates();
  return coords ? coords[parkingId] : null;
}

/**
 * 동기 버전
 */
function getCoordinatesSync(parkingId) {
  const coords = loadCoordinatesSync();
  return coords ? coords[parkingId] : null;
}

module.exports = {
  loadCoordinates,
  loadCoordinatesSync,
  getCoordinates,
  getCoordinatesSync
};

