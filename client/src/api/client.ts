import axios from 'axios';

// 환경 변수에서 API Base URL 가져오기
// Vite는 import.meta.env를 사용하여 환경 변수에 접근
// VITE_ 접두사가 붙은 변수만 클라이언트에서 접근 가능
const getApiBaseUrl = (): string => {
  // 환경 변수가 설정되어 있으면 사용, 없으면 기본값 (개발 환경)
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (baseUrl) {
    return baseUrl;
  }
  
  // 기본값: 개발 환경 (로컬 Express 서버)
  return 'http://localhost:3000/api';
};

// API 클라이언트 설정
export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 60000, // 60초로 증가 (Lambda 함수 실행 시간 및 CORS preflight 고려)
  headers: {
    'Content-Type': 'application/json',
  },
});

// 빠른 응답이 필요한 API용 클라이언트
export const fastApiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 20000, // 20초로 증가
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    // 토큰이 있으면 자동으로 헤더에 추가
    const token = localStorage.getItem('accessToken');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Auth API는 /prod/auth-* 형태, Data API는 /prod/api/* 형태
    // Auth API가 아닌 경우 /api를 추가
    if (config.url && !config.url.startsWith('/auth-')) {
      // 이미 /api로 시작하지 않으면 추가
      if (!config.url.startsWith('/api/')) {
        config.url = '/api' + config.url;
      }
    }
    
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

// 재시도 로직을 위한 헬퍼 함수
const retryRequest = async (config: any, retries = 3, delay = 1000): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios(config);
    } catch (error: any) {
      // 마지막 시도이거나 재시도하면 안 되는 에러인 경우
      if (i === retries - 1 || (error.response && error.response.status >= 400 && error.response.status < 500)) {
        throw error;
      }
      // 지수 백오프: 1초, 2초, 4초...
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw new Error('재시도 실패');
};

// 재시도 가능한 API 호출 래퍼
export const apiClientWithRetry = {
  get: (url: string, config?: any) => retryRequest({ ...config, method: 'GET', url }),
  post: (url: string, data?: any, config?: any) => retryRequest({ ...config, method: 'POST', url, data }),
  put: (url: string, data?: any, config?: any) => retryRequest({ ...config, method: 'PUT', url, data }),
  delete: (url: string, config?: any) => retryRequest({ ...config, method: 'DELETE', url }),
};

const responseErrorHandler = (error: any) => {
  if (error.code === 'ECONNABORTED') {
    console.error('⏱️ 타임아웃 오류:', error.config?.url);
    error.message = '서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
  } else if (error.response) {
    // 서버가 응답했지만 에러 상태
    const status = error.response.status;
    const responseData = error.response.data;
    console.error('❌ 서버 오류:', status, responseData);
    
    // 에러 메시지 추출 (여러 형태 지원)
    // Lambda 응답 구조: {success: false, error: {code, message}}
    let errorMessage = '알 수 없는 오류';
    if (responseData) {
      if (typeof responseData === 'string') {
        errorMessage = responseData;
      } else if (responseData.error) {
        if (typeof responseData.error === 'string') {
          errorMessage = responseData.error;
        } else if (responseData.error.message) {
          // Lambda 응답 구조: error.error.message
          errorMessage = responseData.error.message;
        }
      } else if (responseData.message) {
        errorMessage = responseData.message;
      }
    }
    
    // 5xx 에러는 재시도 가능
    if (status >= 500) {
      error.retryable = true;
      error.message = `서버 오류 (${status}): 일시적인 문제입니다. 잠시 후 다시 시도해주세요.`;
    } else {
      // 4xx 에러 (클라이언트 오류)는 원본 메시지 사용
      // 원본 responseData를 보존하여 AuthContext에서 사용할 수 있도록
      error.originalResponseData = responseData;
      // 항상 메시지 설정 (AuthContext에서 파싱할 수 있도록)
      error.message = errorMessage;
    }
  } else if (error.request) {
    // 요청은 보냈지만 응답 없음 (네트워크 오류)
    console.error('❌ 네트워크 오류:', error.message);
    error.retryable = true;
    error.message = '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.';
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
    // Auth API는 /prod/auth-* 형태, Data API는 /prod/api/* 형태
    // Auth API가 아닌 경우 /api를 추가
    if (config.url && !config.url.startsWith('/auth-')) {
      // 이미 /api로 시작하지 않으면 추가
      if (!config.url.startsWith('/api/')) {
        config.url = '/api' + config.url;
      }
    }
    console.log(`🚀 API 요청 (빠른): ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ 요청 오류:', error);
    return Promise.reject(error);
  }
);
