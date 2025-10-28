// 주차장 정보 비즈니스 로직
const axios = require("axios");
const { getRedisClient } = require("../utils/redisClient");
const { generateParkingCoordinates } = require("../utils/districtCoordinates");
const { loadCoordinates, generateCoordinatesFile } = require("../data/parkingCoordinatesLoader");

class ParkingService {
  constructor() {
    this.redis = getRedisClient();
    this.ttlSeconds = 600; // 10분 캐시 (주차장 정보는 천천히 변함)
    this.baseUrl = process.env.SEOUL_POPULATION_API_URL || "http://openapi.seoul.go.kr:8088";
    this.apiKey = process.env.SEOUL_API_KEY || "47464b765073696c33366142537a7a";
    
    // 서울시 25개 구
    this.districts = [
      '강남구', '강동구', '강북구', '강서구', '관악구',
      '광진구', '구로구', '금천구', '노원구', '도봉구',
      '동대문구', '동작구', '마포구', '서대문구', '서초구',
      '성동구', '성북구', '송파구', '양천구', '영등포구',
      '용산구', '은평구', '종로구', '중구', '중랑구'
    ];
    
    // 주차장 좌표 캐시
    this.parkingCoords = null;
    
    // 초기화
    this.initialize();
  }
  
  async initialize() {
    // 좌표 파일 로드 시도
    this.parkingCoords = loadCoordinates();
    
    // 파일이 없으면 생성
    if (!this.parkingCoords) {
      console.log('🔧 주차장 좌표 파일이 없습니다. 생성 중...');
      this.parkingCoords = await generateCoordinatesFile();
    }
  }

  /**
   * 특정 구의 주차장 정보 가져오기 (요청 시에만)
   */
  async fetchParkingByDistrict(district) {
    const cacheKey = `parking:${district}`;
    
    // 캐시 확인
    const cached = await this.redis.safeGet(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (_) {}
    }

    // API 호출
    try {
      const url = `${this.baseUrl}/${this.apiKey}/json/GetParkingInfo/1/1000/${district}`;
      console.log(`🅿️ 주차장 API 호출: ${district}`);
      
      const response = await axios.get(url, { timeout: 10000 });
      
      const parkings = response.data?.GetParkingInfo?.row || [];
      console.log(`📊 ${district} 주차장 ${parkings.length}개 발견`);
      
      // 첫 번째 주차장의 필드 확인 (디버깅용)
      if (parkings.length > 0) {
        const sample = parkings[0];
        console.log(`📌 샘플 데이터 필드:`, Object.keys(sample).join(', '));
        console.log(`📌 샘플 데이터 전체:`, JSON.stringify(sample, null, 2));
      }
      
      const formattedData = parkings.map((p, index) => {
        const parkingId = p.PARKING_CODE || `P-${district}-${index}`;
        
        // 위도/경도 필드 여러 가능성 시도
        let latitude = parseFloat(p.LAT || p.LATITUDE || p.Y || p.lat) || null;
        let longitude = parseFloat(p.LNG || p.LONGITUDE || p.LOT || p.X || p.lng) || null;
        
        // API에 좌표가 없으면 저장된 좌표 사용
        if ((!latitude || !longitude) && this.parkingCoords && this.parkingCoords[parkingId]) {
          latitude = this.parkingCoords[parkingId].lat;
          longitude = this.parkingCoords[parkingId].lng;
        }
        
        // 그래도 없으면 실시간 생성
        if (!latitude || !longitude) {
          const coords = generateParkingCoordinates(district, p.PARKING_NAME, p.ADDR);
          latitude = coords.lat;
          longitude = coords.lng;
        }
        
        return {
          parkingId,
          name: p.PARKING_NAME,
          district,
          address: p.ADDR,
          total: parseInt(p.CAPACITY) || 0,
          available: parseInt(p.CUR_PARKING) || 0,
          fee: p.RATES || '정보 없음',
          latitude,
          longitude,
          operatingTime: `${p.WEEKDAY_BEGIN_TIME || '00:00'}~${p.WEEKDAY_END_TIME || '24:00'}`,
          updatedAt: new Date().toISOString()
        };
      });

      // 캐시 저장
      await this.redis.safeSetEx(cacheKey, this.ttlSeconds, JSON.stringify(formattedData));
      
      return formattedData;
    } catch (error) {
      console.error(`❌ 주차장 API 호출 실패 (${district}):`, error.message);
      return [];
    }
  }

  /**
   * 전체 주차장 정보 조회 (모든 구)
   */
  async getParkingData() {
    const allParkings = [];
    
    // 25개 구 전체 조회 (병렬 처리)
    const promises = this.districts.map(district => this.fetchParkingByDistrict(district));
    const results = await Promise.all(promises);
    
    results.forEach(parkings => {
      allParkings.push(...parkings);
    });
    
    return allParkings;
  }

  /**
   * 특정 주차장 ID로 조회
   */
  async getParkingDataById(parkingId) {
    // 모든 구를 순회하며 검색 (비효율적이지만 단순함)
    for (const district of this.districts) {
      const parkings = await this.fetchParkingByDistrict(district);
      const found = parkings.find(p => p.parkingId === parkingId);
      if (found) return found;
    }
    
    throw new Error(`주차장을 찾을 수 없습니다: ${parkingId}`);
  }

  /**
   * 구별 주차장 조회
   */
  async getParkingByDistrict(district) {
    if (!this.districts.includes(district)) {
      throw new Error(`유효하지 않은 구 이름입니다: ${district}`);
    }
    
    return await this.fetchParkingByDistrict(district);
  }

  /**
   * 좌표 기반 주변 주차장 검색 (Haversine 거리 계산)
   */
  async findNearbyParking(lat, lng, radiusKm = 1) {
    // 모든 주차장 데이터 가져오기
    const allParkings = await this.getParkingData();
    
    console.log(`🔍 주변 주차장 검색: 총 ${allParkings.length}개 주차장`);
    console.log(`📍 검색 위치: lat=${lat}, lng=${lng}, radius=${radiusKm}km`);
    
    // 위도/경도 있는 주차장 개수 확인
    const withCoords = allParkings.filter(p => p.latitude && p.longitude);
    console.log(`📊 좌표 있는 주차장: ${withCoords.length}개`);
    
    if (withCoords.length > 0) {
      console.log(`📌 샘플 주차장 좌표: ${withCoords[0].name} - lat=${withCoords[0].latitude}, lng=${withCoords[0].longitude}`);
    }
    
    // 거리 계산 및 필터링
    const nearbyParkings = allParkings
      .map(parking => {
        if (!parking.latitude || !parking.longitude) return null;
        
        const distance = this.calculateDistance(lat, lng, parking.latitude, parking.longitude);
        return { ...parking, distance };
      })
      .filter(p => p && p.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
    
    console.log(`✅ ${radiusKm}km 이내 주차장: ${nearbyParkings.length}개`);
    
    return nearbyParkings;
  }

  /**
   * Haversine 공식으로 두 좌표 간 거리 계산 (km)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 지구 반지름 (km)
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }
}

module.exports = new ParkingService();
