import axios from 'axios';

// API 클라이언트 설정
export const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 15000, // 15초로 감소 (너무 오래 기다리지 않도록)
  headers: {
    'Content-Type': 'application/json',
  },
});

// 빠른 응답이 필요한 API용 클라이언트
export const fastApiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 8000, // 8초
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API 요청: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ 요청 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 함수
const responseSuccessHandler = (response: any) => {
  console.log(`✅ API 응답 성공: ${response.config.url}`, response.data);
  return response;
};

const responseErrorHandler = (error: any) => {
  if (error.code === 'ECONNABORTED') {
    console.error('⏱️ 타임아웃 오류:', error.config?.url);
    error.message = '서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
  } else if (error.response) {
    // 서버가 응답했지만 에러 상태
    console.error('❌ 서버 오류:', error.response.status, error.response.data);
    error.message = `서버 오류 (${error.response.status}): ${error.response.data?.message || '알 수 없는 오류'}`;
  } else if (error.request) {
    // 요청은 보냈지만 응답 없음
    console.error('❌ 네트워크 오류:', error.message);
    error.message = '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.';
  } else {
    console.error('❌ 알 수 없는 오류:', error.message);
  }
  return Promise.reject(error);
};

// 응답 인터셉터 적용
apiClient.interceptors.response.use(responseSuccessHandler, responseErrorHandler);
fastApiClient.interceptors.response.use(responseSuccessHandler, responseErrorHandler);

// fastApiClient 요청 인터셉터
fastApiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API 요청 (빠른): ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ 요청 오류:', error);
    return Promise.reject(error);
  }
);
