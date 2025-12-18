// API 타입 정의
export interface AreaInfo {
  category: string;
  no: number;
  areaCode: string;
  areaName: string;
  engName?: string;
}

export interface CrowdData {
  areaCode: string;
  areaInfo: AreaInfo;
  data: Record<string, unknown>;
  fetchedAt: string;
}

export interface SubwayStation {
  areaCode: string;
  areaInfo: AreaInfo;
  subway: {
    SUB_ACML_GTON_PPLTN_MIN: string;
    SUB_ACML_GTON_PPLTN_MAX: string;
    SUB_ACML_GTOFF_PPLTN_MIN: string;
    SUB_ACML_GTOFF_PPLTN_MAX: string;
    SUB_STN_CNT: string;
    SUB_STN_TIME: string;
  };
  fetchedAt: string;
}

export interface ParkingLot {
  parkingId: string;
  district: string;
  address: string;
  total: number;
  available: number;
  fee: string;
  latitude: number;
  longitude: number;
  operatingTime: string;
  updatedAt: string;
  distance?: number; // km 단위
}

export interface RankingItem {
  areaCode: string;
  areaName: string;
  avgPopulation: number;
  totalVisits: number;
  rank: number;
  peakHour?: number;
}

// 히스토리 타임시리즈 데이터
export interface HistoryTimeseries {
  timestamp: string | Date;
  peopleCount: number;
  congestionLevel: number; // 계산된 레벨 (호환성 유지)
  actualCongestionLevel?: string | null; // 실제 혼잡도 레벨 (한산, 여유, 보통, 혼잡, 매우 혼잡)
  actualCongestionMessage?: string | null; // 실제 혼잡도 메시지
}

// 히스토리 API 응답
export interface CrowdHistoryResponse {
  areaCode: string;
  areaName: string;
  period: string;
  dataCount: number;
  timeseries: HistoryTimeseries[];
  average: {
    peopleCount: number;
    congestionLevel: number;
  };
}

// Auth API 타입
export interface LoginRequest {
  id: string;
  password: string;
}

export interface RegisterRequest {
  id: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
    user?: {
      id: string;
    };
  };
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface UserInfo {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}