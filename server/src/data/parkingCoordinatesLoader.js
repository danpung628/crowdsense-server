/**
 * 주차장 좌표 로더 및 생성기
 * 실행 시 자동으로 좌표 파일 생성
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getS3Service } = require('../utils/s3Client');

const SEOUL_API_URL = 'http://openapi.seoul.go.kr:8088';
const SEOUL_API_KEY = '47464b765073696c33366142537a7a';
const COORDS_FILE = path.join(__dirname, 'parkingCoordinates.json');
const S3_KEY = 'data/parkingCoordinates.json';

const districts = [
  '강남구', '강동구', '강북구', '강서구', '관악구',
  '광진구', '구로구', '금천구', '노원구', '도봉구',
  '동대문구', '동작구', '마포구', '서대문구', '서초구',
  '성동구', '성북구', '송파구', '양천구', '영등포구',
  '용산구', '은평구', '종로구', '중구', '중랑구'
];

const districtCoords = {
  '강남구': { lat: 37.5172, lng: 127.0473 },
  '강동구': { lat: 37.5301, lng: 127.1238 },
  '강북구': { lat: 37.6398, lng: 127.0256 },
  '강서구': { lat: 37.5509, lng: 126.8495 },
  '관악구': { lat: 37.4784, lng: 126.9516 },
  '광진구': { lat: 37.5385, lng: 127.0823 },
  '구로구': { lat: 37.4954, lng: 126.8874 },
  '금천구': { lat: 37.4563, lng: 126.8955 },
  '노원구': { lat: 37.6542, lng: 127.0568 },
  '도봉구': { lat: 37.6688, lng: 127.0471 },
  '동대문구': { lat: 37.5744, lng: 127.0396 },
  '동작구': { lat: 37.5124, lng: 126.9393 },
  '마포구': { lat: 37.5663, lng: 126.9019 },
  '서대문구': { lat: 37.5791, lng: 126.9368 },
  '서초구': { lat: 37.4837, lng: 127.0324 },
  '성동구': { lat: 37.5634, lng: 127.0368 },
  '성북구': { lat: 37.5894, lng: 127.0167 },
  '송파구': { lat: 37.5145, lng: 127.1059 },
  '양천구': { lat: 37.5170, lng: 126.8664 },
  '영등포구': { lat: 37.5264, lng: 126.8962 },
  '용산구': { lat: 37.5324, lng: 126.9900 },
  '은평구': { lat: 37.6027, lng: 126.9291 },
  '종로구': { lat: 37.5735, lng: 126.9792 },
  '중구': { lat: 37.5641, lng: 126.9979 },
  '중랑구': { lat: 37.6063, lng: 127.0925 }
};

// 동별 세부 좌표
const dongCoords = {
  '역삼동': { lat: 37.5003, lng: 127.0366 },
  '삼성동': { lat: 37.5140, lng: 127.0634 },
  '대치동': { lat: 37.4946, lng: 127.0626 },
  '논현동': { lat: 37.5106, lng: 127.0308 },
  '청담동': { lat: 37.5232, lng: 127.0473 },
  '신사동': { lat: 37.5203, lng: 127.0202 },
  '압구정동': { lat: 37.5273, lng: 127.0275 },
  '서초동': { lat: 37.4837, lng: 127.0145 },
  '양재동': { lat: 37.4749, lng: 127.0348 },
  '방배동': { lat: 37.4810, lng: 126.9965 }
};

function extractDong(address) {
  const dongMatch = address.match(/([가-힣]+동|[가-힣]+가)/);
  return dongMatch ? dongMatch[1] : null;
}

function estimateCoords(district, address, seed) {
  const dong = extractDong(address);
  
  if (dong && dongCoords[dong]) {
    const base = dongCoords[dong];
    // 시드 기반 랜덤 (일관성 유지)
    const random1 = ((seed * 9301 + 49297) % 233280) / 233280;
    const random2 = ((seed * 7919 + 32749) % 233280) / 233280;
    return {
      lat: parseFloat((base.lat + (random1 - 0.5) * 0.01).toFixed(6)),
      lng: parseFloat((base.lng + (random2 - 0.5) * 0.01).toFixed(6))
    };
  }
  
  const base = districtCoords[district];
  if (!base) return null;
  
  const random1 = ((seed * 9301 + 49297) % 233280) / 233280;
  const random2 = ((seed * 7919 + 32749) % 233280) / 233280;
  return {
    lat: parseFloat((base.lat + (random1 - 0.5) * 0.036).toFixed(6)),
    lng: parseFloat((base.lng + (random2 - 0.5) * 0.045).toFixed(6))
  };
}

async function fetchParkingData(district) {
  try {
    const url = `${SEOUL_API_URL}/${SEOUL_API_KEY}/json/GetParkingInfo/1/1000/${district}`;
    const response = await axios.get(url, { timeout: 10000 });
    return response.data?.GetParkingInfo?.row || [];
  } catch (error) {
    console.error(`주차장 API 호출 실패 (${district}):`, error.message);
    return [];
  }
}

async function generateCoordinatesFile() {
  console.log('🚀 주차장 좌표 생성 중...');
  
  const parkingCoordinates = {};
  let totalCount = 0;
  
  for (const district of districts) {
    console.log(`📍 ${district} 처리 중...`);
    const parkings = await fetchParkingData(district);
    
    for (let i = 0; i < parkings.length; i++) {
      const parking = parkings[i];
      const parkingId = parking.PARKING_CODE || `P-${district}-${i}`;
      const address = parking.ADDR || '';
      const name = parking.PARKING_NAME || `${district} 주차장 ${i+1}`;
      
      const coords = estimateCoords(district, address, totalCount);
      
      if (coords) {
        parkingCoordinates[parkingId] = {
          name: name,
          address: address,
          district: district,
          ...coords
        };
        totalCount++;
        
        // 처음 2개만 로그
        if (i < 2) {
          console.log(`  ✅ ${name}: ${address} → (${coords.lat}, ${coords.lng})`);
        }
      }
    }
    console.log(`  ${district} 완료: ${parkings.length}개 처리`);
  }
  
  console.log(`\n✅ 주차장 좌표 파일 생성 완료: ${totalCount}개`);
  
  // S3와 로컬에 동시 저장
  const s3Service = getS3Service();
  try {
    await s3Service.uploadJsonFile(S3_KEY, COORDS_FILE, parkingCoordinates);
  } catch (error) {
    // S3 실패해도 로컬 저장은 유지
    fs.writeFileSync(COORDS_FILE, JSON.stringify(parkingCoordinates, null, 2), 'utf-8');
    console.log(`💾 로컬에만 저장 완료: ${COORDS_FILE}`);
  }
  
  return parkingCoordinates;
}

async function loadCoordinates() {
  const s3Service = getS3Service();
  
  // S3에서 먼저 로드 시도 (EC2 환경인 경우)
  if (s3Service.isS3Available()) {
    try {
      console.log('📡 S3에서 주차장 좌표 로드 시도...');
      const coords = await s3Service.downloadJsonFile(S3_KEY, COORDS_FILE);
      if (coords) {
        console.log(`📂 S3에서 주차장 좌표 로드: ${Object.keys(coords).length}개`);
        return coords;
      }
    } catch (error) {
      console.log('⚠️ S3 로드 실패, 로컬 파일 시도...');
    }
  }
  
  // 로컬 파일에서 로드
  if (fs.existsSync(COORDS_FILE)) {
    try {
      const data = fs.readFileSync(COORDS_FILE, 'utf-8');
      const coords = JSON.parse(data);
      console.log(`📂 로컬에서 주차장 좌표 로드: ${Object.keys(coords).length}개`);
      return coords;
    } catch (error) {
      console.error('주차장 좌표 파일 로드 실패:', error.message);
      return null;
    }
  }
  
  console.log('📁 주차장 좌표 파일을 찾을 수 없습니다');
  return null;
}

// 동기 버전 (기존 호환성 유지)
function loadCoordinatesSync() {
  if (fs.existsSync(COORDS_FILE)) {
    try {
      const data = fs.readFileSync(COORDS_FILE, 'utf-8');
      const coords = JSON.parse(data);
      console.log(`📂 주차장 좌표 로드 (동기): ${Object.keys(coords).length}개`);
      return coords;
    } catch (error) {
      console.error('주차장 좌표 파일 로드 실패:', error.message);
      return null;
    }
  }
  return null;
}

async function getCoordinates(parkingId) {
  const coords = await loadCoordinates();
  return coords ? coords[parkingId] : null;
}

function getCoordinatesSync(parkingId) {
  const coords = loadCoordinatesSync();
  return coords ? coords[parkingId] : null;
}

module.exports = {
  generateCoordinatesFile,
  loadCoordinates,
  loadCoordinatesSync,
  getCoordinates,
  getCoordinatesSync
};

