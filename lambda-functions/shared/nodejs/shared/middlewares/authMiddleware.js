/**
 * Lambda 함수용 인증 미들웨어
 * API Gateway 이벤트에서 토큰을 추출하고 검증
 */

const { verifyAccessToken } = require('../utils/jwtUtils');
const { AppError } = require('../utils/errorHandler');

/**
 * Lambda 이벤트에서 사용자 정보 추출
 * @param {Object} event - Lambda 이벤트 객체
 * @returns {Object} 사용자 정보 또는 null
 */
function extractUserFromEvent(event) {
  try {
    const devFlag = process.env.DEV_FLAG || '1';

    // DEV_FLAG가 1이면 인증 스킵
    if (devFlag === '1') {
      return {
        userId: 'dev-user',
        isDev: true
      };
    }

    // Authorization 헤더에서 토큰 추출
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    
    return {
      userId: decoded.userId,
      isDev: false
    };
  } catch (error) {
    return null;
  }
}

/**
 * 인증 필수 미들웨어
 * @param {Object} event - Lambda 이벤트 객체
 * @returns {Object} 사용자 정보
 * @throws {AppError} 인증 실패 시
 */
function requireAuth(event) {
  const user = extractUserFromEvent(event);
  
  if (!user) {
    throw new AppError('인증 토큰이 필요합니다.', 401, 'MISSING_TOKEN');
  }
  
  return user;
}

/**
 * 선택적 인증 미들웨어
 * @param {Object} event - Lambda 이벤트 객체
 * @returns {Object|null} 사용자 정보 또는 null
 */
function optionalAuth(event) {
  return extractUserFromEvent(event);
}

module.exports = {
  extractUserFromEvent,
  requireAuth,
  optionalAuth
};

