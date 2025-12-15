// 주차장 정보 비즈니스 로직 (DynamoDB 기반)
const axios = require("axios");
const { getRedisClient } = require("../utils/redisClient");
const { generateParkingCoordinates } = require("../utils/districtCoordinates");
const { loadCoordinates, loadCoordinatesSync } = require("../data/parkingCoordinatesLoader");

class ParkingService {
  constructor() {
    this.redis = getRedisClient();
    this.ttlSeconds = 600; // 10분 캐시
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
    try {
      this.parkingCoords = await loadCoordinates();
    } catch (error) {
      console.log('⚠️ 비동기 로드 실패, 동기 로드 시도...');
      this.parkingCoords = loadCoordinatesSync();
    }
  }

  /**
   * 특정 구의 주차장 정보 가져오기
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
      
      const response = await axios.get(url, { timeout: 10000 });
      
      const parkings = response.data?.GetParkingInfo?.row || [];
      
      const formattedData = parkings.map((p, index) => {
        const parkingId = p.PKLT_CD || `P-${district}-${index}`;
        
        let latitude = null;
        let longitude = null;
        
        if (this.parkingCoords && this.parkingCoords[parkingId]) {
          latitude = this.parkingCoords[parkingId].lat;
          longitude = this.parkingCoords[parkingId].lng;
        } else {
          const coords = generateParkingCoordinates(district, p.PKLT_NM, p.ADDR);
          latitude = coords.lat;
          longitude = coords.lng;
        }
        
        const totalSpaces = parseInt(p.TPKCT) || 0;
        const currentVehicles = parseInt(p.NOW_PRK_VHCL_CNT) || 0;
        const availableSpaces = Math.max(0, totalSpaces - currentVehicles);
        
        return {
          parkingId,
          code: p.PKLT_CD,
          name: p.PKLT_NM,
          district,
          address: p.ADDR,
          type: p.PRK_TYPE_NM || p.PKLT_TYPE,
          operationType: p.OPER_SE_NM || p.OPER_SE,
          tel: p.TELNO,
          total: totalSpaces,
          current: currentVehicles,
          available: availableSpaces,
          isAvailable: availableSpaces > 0,
          isPaidParking: p.PAY_YN === 'Y',
          rates: {
            basic: {
              fee: parseInt(p.BSC_PRK_CRG) || 0,
              time: parseInt(p.BSC_PRK_HR) || 0
            },
            additional: {
              fee: parseInt(p.ADD_PRK_CRG) || 0,
              time: parseInt(p.ADD_PRK_HR) || 0
            },
            dayMax: parseInt(p.DAY_MAX_CRG) || 0
          },
          operatingHours: {
            weekday: `${p.WD_OPER_BGNG_TM || '0000'}-${p.WD_OPER_END_TM || '2400'}`,
            weekend: `${p.WE_OPER_BGNG_TM || '0000'}-${p.WE_OPER_END_TM || '2400'}`,
            holiday: `${p.LHLDY_OPER_BGNG_TM || '0000'}-${p.LHLDY_OPER_END_TM || '2400'}`
          },
          nightFree: p.NGHT_PAY_YN === 'Y',
          coordinates: {
            latitude,
            longitude
          },
          lastUpdated: p.NOW_PRK_VHCL_UPDT_TM || new Date().toISOString(),
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
   * 전체 주차장 정보 조회
   */
  async getParkingData() {
    const allParkings = [];
    const promises = this.districts.map(district => this.fetchParkingByDistrict(district));
    const results = await Promise.all(promises);
    
    results.forEach(parkings => {
      allParkings.push(...parkings);
    });
    
    return allParkings;
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
   * 좌표 기반 주변 주차장 검색
   */
  async findNearbyParking(lat, lng, radiusKm = 1) {
    const allParkings = await this.getParkingData();
    
    const nearbyParkings = allParkings
      .map(parking => {
        if (!parking.coordinates?.latitude || !parking.coordinates?.longitude) return null;
        
        const distance = this.calculateDistance(lat, lng, parking.coordinates.latitude, parking.coordinates.longitude);
        return { ...parking, distance };
      })
      .filter(p => p && p.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
    
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

