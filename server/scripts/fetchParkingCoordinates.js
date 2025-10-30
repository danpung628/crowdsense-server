/**
 * 주차장 주소를 좌표로 변환하여 JSON 파일로 저장
 * Kakao Maps Geocoding API 사용
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getS3Service } = require('../src/utils/s3Client');

// Kakao REST API 키 (무료, 하루 30만건)
// https://developers.kakao.com/ 에서 발급
const KAKAO_API_KEY = process.env.KAKAO_API_KEY || '발급받은_키를_여기에';

// 서울시 공공데이터 API 설정
const SEOUL_API_URL = 'http://openapi.seoul.go.kr:8088';
const SEOUL_API_KEY = process.env.SEOUL_API_KEY || '47464b765073696c33366142537a7a';

const districts = [
  '강남구', '강동구', '강북구', '강서구', '관악구',
  '광진구', '구로구', '금천구', '노원구', '도봉구',
  '동대문구', '동작구', '마포구', '서대문구', '서초구',
  '성동구', '성북구', '송파구', '양천구', '영등포구',
  '용산구', '은평구', '종로구', '중구', '중랑구'
];

/**
 * Kakao Geocoding API로 주소를 좌표로 변환
 */
async function addressToCoords(address) {
  if (!address) return null;
  
  try {
    const response = await axios.get('https://dapi.kakao.com/v2/local/search/address.json', {
      params: { query: address },
      headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
      timeout: 5000
    });
    
    if (response.data.documents && response.data.documents.length > 0) {
      const result = response.data.documents[0];
      return {
        lat: parseFloat(result.y),
        lng: parseFloat(result.x)
      };
    }
    return null;
  } catch (error) {
    console.error(`주소 변환 실패: ${address} - ${error.message}`);
    return null;
  }
}

/**
 * 서울시 주차장 API에서 데이터 가져오기
 */
async function fetchParkingData(district) {
  try {
    const url = `${SEOUL_API_URL}/${SEOUL_API_KEY}/json/GetParkingInfo/1/1000/${district}`;
    const response = await axios.get(url, { timeout: 10000 });
    
    const parkings = response.data?.GetParkingInfo?.row || [];
    console.log(`📊 ${district}: ${parkings.length}개 주차장 발견`);
    
    return parkings;
  } catch (error) {
    console.error(`❌ ${district} 주차장 API 호출 실패:`, error.message);
    return [];
  }
}

/**
 * 모든 주차장 좌표 수집
 */
async function collectAllParkingCoordinates() {
  const parkingCoordinates = {};
  let totalCount = 0;
  let successCount = 0;
  
  console.log('🚀 주차장 좌표 수집 시작...\n');
  
  for (const district of districts) {
    console.log(`\n📍 ${district} 처리 중...`);
    
    const parkings = await fetchParkingData(district);
    totalCount += parkings.length;
    
    for (let i = 0; i < parkings.length; i++) {
      const parking = parkings[i];
      const parkingId = parking.PARKING_CODE || `P-${district}-${i}`;
      const address = parking.ADDR;
      
      if (!address) {
        console.log(`  ⚠️  주소 없음: ${parking.PARKING_NAME}`);
        continue;
      }
      
      // Kakao API 호출 (Rate Limiting 고려: 초당 10건)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const coords = await addressToCoords(address);
      
      if (coords) {
        parkingCoordinates[parkingId] = {
          name: parking.PARKING_NAME,
          address: address,
          district: district,
          ...coords
        };
        successCount++;
        console.log(`  ✅ ${parking.PARKING_NAME}: (${coords.lat}, ${coords.lng})`);
      } else {
        console.log(`  ❌ 좌표 변환 실패: ${parking.PARKING_NAME} - ${address}`);
      }
    }
    
    console.log(`${district} 완료: ${parkings.length}개 중 ${successCount}개 성공`);
  }
  
  console.log(`\n\n🎉 전체 완료: ${totalCount}개 중 ${successCount}개 성공`);
  
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
  if (KAKAO_API_KEY === '발급받은_키를_여기에') {
    console.error('❌ Kakao API 키가 필요합니다!');
    console.log('\n1. https://developers.kakao.com/ 접속');
    console.log('2. 내 애플리케이션 > 앱 추가하기');
    console.log('3. REST API 키 복사');
    console.log('4. .env 파일에 KAKAO_API_KEY=복사한키 추가');
    console.log('   또는 이 파일의 KAKAO_API_KEY 변수에 직접 입력\n');
    process.exit(1);
  }
  
  try {
    const coordinates = await collectAllParkingCoordinates();
    saveToFile(coordinates, 'parkingCoordinates.json');
    
    console.log('\n✅ 모든 작업 완료!');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

// 직접 실행 시
if (require.main === module) {
  main();
}

module.exports = { collectAllParkingCoordinates, addressToCoords };

