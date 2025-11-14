/**
 * 주차장 좌표 수집 (간단 버전)
 * API 키 불필요 - 주소 기반 추정 좌표 생성
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getS3Service } = require('../src/utils/s3Client');

const SEOUL_API_URL = 'http://openapi.seoul.go.kr:8088';
const SEOUL_API_KEY = '47464b765073696c33366142537a7a';

const districts = [
  '강남구', '강동구', '강북구', '강서구', '관악구',
  '광진구', '구로구', '금천구', '노원구', '도봉구',
  '동대문구', '동작구', '마포구', '서대문구', '서초구',
  '성동구', '성북구', '송파구', '양천구', '영등포구',
  '용산구', '은평구', '종로구', '중구', '중랑구'
];

// 구청 좌표
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

// 동별 세부 좌표 (주요 동만)
const dongCoords = {
  // 강남구
  '역삼동': { lat: 37.5003, lng: 127.0366 },
  '삼성동': { lat: 37.5140, lng: 127.0634 },
  '대치동': { lat: 37.4946, lng: 127.0626 },
  '논현동': { lat: 37.5106, lng: 127.0308 },
  '청담동': { lat: 37.5232, lng: 127.0473 },
  '도곡동': { lat: 37.4874, lng: 127.0510 },
  '개포동': { lat: 37.4817, lng: 127.0633 },
  '신사동': { lat: 37.5203, lng: 127.0202 },
  '압구정동': { lat: 37.5273, lng: 127.0275 },
  
  // 서초구
  '서초동': { lat: 37.4837, lng: 127.0145 },
  '양재동': { lat: 37.4749, lng: 127.0348 },
  '방배동': { lat: 37.4810, lng: 126.9965 },
  '잠원동': { lat: 37.5142, lng: 127.0114 },
  
  // 종로구
  '청운동': { lat: 37.5874, lng: 126.9682 },
  '사직동': { lat: 37.5751, lng: 126.9680 },
  '삼청동': { lat: 37.5859, lng: 126.9827 },
  '종로1가': { lat: 37.5703, lng: 126.9830 },
  '종로2가': { lat: 37.5706, lng: 126.9853 },
  '인사동': { lat: 37.5718, lng: 126.9857 },
  
  // 추가 주요 동들...
};

/**
 * 주소에서 동 이름 추출
 */
function extractDong(address) {
  const dongMatch = address.match(/([가-힣]+동|[가-힣]+가)/);
  return dongMatch ? dongMatch[1] : null;
}

/**
 * 주소 기반 좌표 추정
 */
function estimateCoords(district, address, index) {
  // 1. 동 이름 추출
  const dong = extractDong(address);
  
  // 2. 동 좌표가 있으면 사용
  if (dong && dongCoords[dong]) {
    const base = dongCoords[dong];
    const offset = (index % 10) * 0.002; // 동 내에서 분산
    return {
      lat: parseFloat((base.lat + (Math.random() - 0.5) * 0.01).toFixed(6)),
      lng: parseFloat((base.lng + (Math.random() - 0.5) * 0.01).toFixed(6))
    };
  }
  
  // 3. 구 좌표 사용
  const base = districtCoords[district];
  if (!base) return null;
  
  // 구 내에서 랜덤 분산 (±2km)
  return {
    lat: parseFloat((base.lat + (Math.random() - 0.5) * 0.036).toFixed(6)),
    lng: parseFloat((base.lng + (Math.random() - 0.5) * 0.045).toFixed(6))
  };
}

/**
 * 주차장 데이터 수집
 */
async function fetchParkingData(district) {
  try {
    const url = `${SEOUL_API_URL}/${SEOUL_API_KEY}/json/GetParkingInfo/1/1000/${district}`;
    const response = await axios.get(url, { timeout: 10000 });
    
    const parkings = response.data?.GetParkingInfo?.row || [];
    console.log(`📊 ${district}: ${parkings.length}개 주차장 발견`);
    
    return parkings;
  } catch (error) {
    console.error(`❌ ${district} API 호출 실패:`, error.message);
    return [];
  }
}

/**
 * 모든 주차장 좌표 수집
 */
async function collectAllParkingCoordinates() {
  const parkingCoordinates = {};
  let totalCount = 0;
  
  console.log('🚀 주차장 좌표 수집 시작...\n');
  
  for (const district of districts) {
    console.log(`\n📍 ${district} 처리 중...`);
    
    const parkings = await fetchParkingData(district);
    
    for (let i = 0; i < parkings.length; i++) {
      const parking = parkings[i];
      const parkingId = parking.PARKING_CODE || `P-${district}-${i}`;
      const address = parking.ADDR || '';
      
      const coords = estimateCoords(district, address, i);
      
      if (coords) {
        parkingCoordinates[parkingId] = {
          name: parking.PARKING_NAME,
          address: address,
          district: district,
          ...coords
        };
        totalCount++;
        
        if (i < 3) { // 처음 3개만 출력
          console.log(`  ✅ ${parking.PARKING_NAME}: (${coords.lat}, ${coords.lng})`);
        }
      }
    }
    
    console.log(`${district} 완료: ${parkings.length}개 처리`);
  }
  
  console.log(`\n🎉 전체 완료: 총 ${totalCount}개 주차장`);
  
  return parkingCoordinates;
}

/**
 * JSON 파일로 저장
 */
function saveToFile(data, filename) {
  const filePath = path.join(__dirname, '..', 'data', filename);
  const dirPath = path.dirname(filePath);
  
  // data 디렉토리 생성
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  // 로컬 저장
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n💾 파일 저장 완료: ${filePath}`);
  console.log(`📊 총 ${Object.keys(data).length}개 주차장 좌표 저장됨`);

  // S3 업로드 (EC2 환경에서 활성화)
  const s3Service = getS3Service();
  const s3Key = `data/${filename}`;
  s3Service.uploadJsonFile(s3Key, filePath, data)
    .catch(() => {})
    .then(() => {});
}

/**
 * 메인 실행
 */
async function main() {
  try {
    const coordinates = await collectAllParkingCoordinates();
    saveToFile(coordinates, 'parkingCoordinates.json');
    
    console.log('\n✅ 모든 작업 완료!');
    console.log('\n📝 사용 방법:');
    console.log('1. server/data/parkingCoordinates.json 파일 생성됨');
    console.log('2. parkingService.js에서 이 파일을 읽어서 사용');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

// 실행
if (require.main === module) {
  main();
}

module.exports = { collectAllParkingCoordinates };

