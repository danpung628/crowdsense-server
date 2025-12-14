/**
 * Lambda 함수용 응답 헬퍼
 */

/**
 * CORS 헤더
 */
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

/**
 * OPTIONS 요청 처리 (CORS preflight)
 */
const handleOptions = () => {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: ''
  };
};

/**
 * 성공 응답 생성
 */
const successResponse = (data, statusCode = 200) => {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(data)
  };
};

/**
 * 에러 응답 생성
 */
const errorResponse = (error, statusCode = 500) => {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || '알 수 없는 오류가 발생했습니다.'
      }
    })
  };
};

module.exports = {
  corsHeaders,
  handleOptions,
  successResponse,
  errorResponse
};

