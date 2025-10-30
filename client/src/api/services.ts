import { apiClient } from './client';
import type { AreaInfo, CrowdData, SubwayStation, ParkingLot, RankingItem, CrowdHistoryResponse } from './types';

// 인파 API
export const crowdApi = {
  // 전체 인파 데이터 조회
  getAll: async (): Promise<CrowdData[]> => {
    const response = await apiClient.get('/crowds');
    
    // 응답 구조: { success, data: { items: [], pagination: {} } }
    const responseData = response.data.data || response.data;
    const items = responseData.items || responseData;
    
    // 배열이 아니면 빈 배열 반환
    if (!Array.isArray(items)) {
      console.warn('⚠️ Crowd API 응답이 배열이 아닙니다:', items);
      return [];
    }
    
    return items;
  },

  // 특정 지역 인파 데이터 조회
  getByAreaCode: async (areaCode: string): Promise<CrowdData> => {
    const response = await apiClient.get(`/crowds/${areaCode}`);
    return response.data.data || response.data;
  },

  // 특정 지역의 히스토리 조회
  getHistory: async (
    areaCode: string,
    hours: number = 24
  ): Promise<CrowdHistoryResponse> => {
    const response = await apiClient.get(`/crowds/${areaCode}/history`, {
      params: { hours },
    });
    return response.data.data || response.data;
  },

  // 통계 조회
  getStats: async (areaCode: string, days: number = 7) => {
    const response = await apiClient.get(`/crowds/${areaCode}/stats`, {
      params: { days },
    });
    return response.data.data || response.data;
  },
};

// 지하철 API
export const subwayApi = {
  // 전체 지하철 혼잡도 조회
  getAll: async (): Promise<SubwayStation[]> => {
    const response = await apiClient.get('/subway');
    
    // 응답 구조: { success, data: { items: [], pagination: {} } }
    const responseData = response.data.data || response.data;
    const items = responseData.items || responseData;
    
    // 배열이 아니면 빈 배열 반환
    if (!Array.isArray(items)) {
      console.warn('⚠️ Subway API 응답이 배열이 아닙니다:', items);
      return [];
    }
    
    return items;
  },

  // 특정 역 혼잡도 조회
  getByStationId: async (stationId: string): Promise<SubwayStation> => {
    const response = await apiClient.get(`/subway/${stationId}`);
    return response.data.data || response.data;
  },

  // 노선별 조회
  getByLine: async (line: string): Promise<SubwayStation[]> => {
    const response = await apiClient.get('/subway', {
      params: { line },
    });
    return response.data.data || response.data;
  },
};

// 주차장 API
export const parkingApi = {
  // 전체 주차장 조회
  getAll: async (): Promise<ParkingLot[]> => {
    const response = await apiClient.get('/parking');
    
    // 응답 구조: { success, data: { items: [], pagination: {} } }
    const responseData = response.data.data || response.data;
    const items = responseData.items || responseData;
    
    // 배열이 아니면 빈 배열 반환
    if (!Array.isArray(items)) {
      console.warn('⚠️ Parking API 응답이 배열이 아닙니다:', items);
      return [];
    }
    
    return items;
  },

  // 특정 주차장 조회
  getByCode: async (parkingCode: string): Promise<ParkingLot> => {
    const response = await apiClient.get(`/parking/${parkingCode}`);
    return response.data.data || response.data;
  },

  // 주변 주차장 검색
  getNearby: async (
    latitude: number,
    longitude: number,
    radius: number = 1000
  ): Promise<ParkingLot[]> => {
    const response = await apiClient.get('/parking/nearby', {
      params: { lat: latitude, lng: longitude, radius },
    });
    return response.data.data || response.data;
  },

  // 구별 주차장 조회
  getByDistrict: async (district: string): Promise<ParkingLot[]> => {
    const response = await apiClient.get(`/parking/district/${district}`);
    return response.data.data || response.data;
  },

  // 검색
  search: async (query: string): Promise<ParkingLot[]> => {
    const response = await apiClient.get('/parking/search', {
      params: { q: query },
    });
    return response.data.data || response.data;
  },
};

// 지역 정보 API
export const areaApi = {
  // 전체 지역 조회
  getAll: async (): Promise<AreaInfo[]> => {
    const response = await apiClient.get('/areas'); // /api 제거
    return response.data.data || response.data;
  },

  // 특정 지역 조회
  getByCode: async (areaCode: string): Promise<AreaInfo> => {
    const response = await apiClient.get(`/areas/${areaCode}`);
    return response.data.data || response.data;
  },

  // 카테고리 목록 조회
  getCategories: async (): Promise<string[]> => {
    const response = await apiClient.get('/areas/categories');
    return response.data.data || response.data;
  },

  // 카테고리별 조회
  getByCategory: async (category: string): Promise<AreaInfo[]> => {
    const response = await apiClient.get(`/areas/category/${category}`);
    return response.data.data || response.data;
  },

  // 검색
  search: async (query: string): Promise<AreaInfo[]> => {
    const response = await apiClient.get('/areas/search', {
      params: { q: query },
    });
    return response.data.data || response.data;
  },
};

// 랭킹 API
// NOTE: 백엔드 ranking API는 인증이 필요하므로, 임시로 인파 데이터 기반 목 데이터 사용
export const rankingApi = {
  // 인기 장소 랭킹
  getTopPlaces: async (limit: number = 10): Promise<RankingItem[]> => {
    try {
      // 인파 데이터를 가져와서 랭킹 생성
      const crowdData = await crowdApi.getAll();
      
      // 배열인지 확인
      if (!Array.isArray(crowdData)) {
        console.warn('⚠️ crowdData가 배열이 아닙니다:', typeof crowdData, crowdData);
        return [];
      }

      if (crowdData.length === 0) {
        console.warn('⚠️ crowdData가 비어있습니다');
        return [];
      }
      
      const mockRanking: RankingItem[] = crowdData
        .slice(0, limit * 2)
        .map((crowd: CrowdData) => {
          // 데이터 구조: data['SeoulRtd.citydata_ppltn'][0]
          const cityDataArray = crowd.data?.['SeoulRtd.citydata_ppltn'] as Array<Record<string, string>> | undefined;
          const cityData = cityDataArray?.[0];
          const populationMin = parseInt(cityData?.AREA_PPLTN_MIN || '0');
          const populationMax = parseInt(cityData?.AREA_PPLTN_MAX || '0');
          const avgPopulation = Math.floor((populationMin + populationMax) / 2);
          
          return {
            rank: 0,
            areaCode: crowd.areaCode,
            areaName: crowd.areaInfo?.areaName || '알 수 없음',
            avgPopulation: avgPopulation || 5000,
            totalVisits: avgPopulation * 10 || 50000,
          };
        });
      
      // 인구수 기준으로 정렬
      mockRanking.sort((a, b) => b.avgPopulation - a.avgPopulation);
      
      // 상위 limit개만 선택하고 순위 재할당
      return mockRanking.slice(0, limit).map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
    } catch (error) {
      console.warn('⚠️ 랭킹 데이터 생성 실패, 빈 배열 반환:', error);
      return [];
    }
  },

  // 기간별 랭킹
  getByPeriod: async (
    period: 'day' | 'week' | 'month',
    limit: number = 10
  ): Promise<RankingItem[]> => {
    try {
      // 기간을 시간으로 변환
      const hoursMap: Record<'day' | 'week' | 'month', number> = {
        day: 24,
        week: 168,   // 7일
        month: 720   // 30일
      };
      
      const hours = hoursMap[period];
      console.log(`📊 ${period} 랭킹 요청 (hours: ${hours})`);
      
      // 백엔드 API 호출
      const response = await apiClient.get('/rankings/popular', {
        params: { limit, hours }
      });
      
      // 응답 구조: { success, data: [...] }
      const responseData = response.data.data || response.data;
      const rankings = Array.isArray(responseData) ? responseData : [];
      
      // 백엔드 응답 형식을 프론트엔드 타입으로 변환
      // 백엔드: { rank, areaCode, areaName, category, avgPeople, maxPeople, avgCongestion }
      // 프론트엔드: { rank, areaCode, areaName, avgPopulation, totalVisits, peakHour? }
      return rankings.map((item: { rank?: number; areaCode: string; areaName: string; avgPeople?: number; maxPeople?: number }) => ({
        rank: item.rank || 0,
        areaCode: item.areaCode,
        areaName: item.areaName,
        avgPopulation: item.avgPeople || 0,
        totalVisits: item.maxPeople || item.avgPeople || 0,
        peakHour: undefined // 백엔드에 피크타임 정보가 없으면 undefined
      }));
    } catch (error) {
      console.warn('⚠️ 랭킹 API 호출 실패, 임시 목 데이터로 대체:', error);
      // 에러 발생 시 기존 목 데이터 사용
      return rankingApi.getTopPlaces(limit);
    }
  },
};
