/**
 * 표준화된 에러 응답 유틸리티
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
 * 에러 핸들러 미들웨어
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Mongoose 중복 키 에러
  if (err.code === 11000) {
    const message = '이미 존재하는 데이터입니다.';
    error = new AppError(message, 400, 'DUPLICATE_ERROR');
  }

  // Mongoose 유효성 검사 에러
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400, 'VALIDATION_ERROR');
  }

  // JWT 에러
  if (err.name === 'JsonWebTokenError') {
    const message = '유효하지 않은 토큰입니다.';
    error = new AppError(message, 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    const message = '토큰이 만료되었습니다.';
    error = new AppError(message, 401, 'TOKEN_EXPIRED');
  }

  res.status(error.statusCode || 500).json(errorResponse(error));
};

module.exports = {
  AppError,
  successResponse,
  errorResponse,
  errorHandler
};


