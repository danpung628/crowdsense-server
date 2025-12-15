/**
 * 표준화된 에러 응답 유틸리티 (Lambda용)
 */

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 성공 응답 포맷
 */
const successResponse = (data, message = null, links = null) => {
  const response = {
    success: true,
    data
  };
  if (message) {
    response.message = message;
  }
  if (links) {
    response._links = links;
  }
  return response;
};

/**
 * 에러 응답 포맷
 */
const errorResponse = (error, message = null) => {
  return {
    success: false,
    error: {
      code: error.code || 'UNKNOWN_ERROR',
      message: message || error.message || '알 수 없는 오류가 발생했습니다.'
    }
  };
};

/**
 * Lambda 함수용 에러 핸들러
 */
const handleLambdaError = (error) => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = error.message || '알 수 없는 오류가 발생했습니다.';

  // DynamoDB 에러 처리
  if (error.name === 'ConditionalCheckFailedException') {
    statusCode = 400;
    code = 'DUPLICATE_ERROR';
    message = '이미 존재하는 데이터입니다.';
  }

  // JWT 에러
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = '유효하지 않은 토큰입니다.';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = '토큰이 만료되었습니다.';
  }

  // AppError 인스턴스인 경우
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
  }

  return {
    statusCode,
    body: JSON.stringify(errorResponse({ code, message }))
  };
};

module.exports = {
  AppError,
  successResponse,
  errorResponse,
  handleLambdaError
};

