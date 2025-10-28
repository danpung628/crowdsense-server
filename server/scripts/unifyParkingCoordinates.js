const fs = require('fs');
const path = require('path');

// districtCoordinates 정의
const districtCoordinates = {
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

// parkingCoordinates.json 파일 경로
const filePath = path.join(__dirname, '../src/data/parkingCoordinates.json');

// JSON 파일 읽기
const parkingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// 각 주차장의 좌표를 자치구 대표 좌표로 통일
let updatedCount = 0;
for (const key in parkingData) {
  const parking = parkingData[key];
  const district = parking.district;
  
  if (districtCoordinates[district]) {
    parking.lat = districtCoordinates[district].lat;
    parking.lng = districtCoordinates[district].lng;
    updatedCount++;
  } else {
    console.warn(`⚠️  알 수 없는 자치구: ${district} (${parking.name})`);
  }
}

// JSON 파일에 저장 (pretty print)
fs.writeFileSync(filePath, JSON.stringify(parkingData, null, 2), 'utf8');

console.log(`✅ 완료: ${updatedCount}개 주차장 좌표를 자치구 대표 좌표로 통일했습니다.`);
console.log(`📁 파일: ${filePath}`);

