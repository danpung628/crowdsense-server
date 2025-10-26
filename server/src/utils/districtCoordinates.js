/**
 * 서울시 25개 자치구 대표 좌표
 * (각 구청 위치 기준)
 */
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

/**
 * 자치구 이름으로 대표 좌표 가져오기
 */
function getDistrictCoordinates(district) {
  return districtCoordinates[district] || null;
}

/**
 * 주차장 이름과 주소로 추정 좌표 생성
 * (구청 좌표 기준 + 랜덤 오프셋)
 */
function generateParkingCoordinates(district, parkingName, address) {
  const baseCoord = districtCoordinates[district];
  if (!baseCoord) return { lat: null, lng: null };
  
  // 구 내에서 랜덤 오프셋 (약 ±2km 범위)
  const latOffset = (Math.random() - 0.5) * 0.036; // 약 ±2km
  const lngOffset = (Math.random() - 0.5) * 0.045; // 약 ±2km
  
  return {
    lat: parseFloat((baseCoord.lat + latOffset).toFixed(6)),
    lng: parseFloat((baseCoord.lng + lngOffset).toFixed(6))
  };
}

/**
 * 모든 자치구 목록
 */
function getAllDistricts() {
  return Object.keys(districtCoordinates);
}

module.exports = {
  getDistrictCoordinates,
  generateParkingCoordinates,
  getAllDistricts
};

