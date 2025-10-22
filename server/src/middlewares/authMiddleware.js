const { verifyAccessToken } = require('../utils/jwtUtils');
const { AppError } = require('../utils/errorHandler');

/**
 * DEV_FLAG 기반 인증 미들웨어
 * DEV_FLAG=1이면 인증 스킵, DEV_FLAG=0이면 JWT 토큰 검증
 */
const authenticate = (req, res, next) => {
  try {
    const devFlag = process.env.DEV_FLAG || '1';

    // DEV_FLAG가 1이면 인증 스킵
    if (devFlag === '1') {
      req.user = {
        userId: 'dev-user',
        isDev: true
      };
      return next();
    }

    // DEV_FLAG가 0이면 JWT 토큰 검증
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('인증 토큰이 필요합니다.', 401, 'MISSING_TOKEN');
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    
    req.user = {
      userId: decoded.userId,
      isDev: false
    };
    
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message
        }
      });
    }
    
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: error.message || '인증에 실패했습니다.'
      }
    });
  }
};

/**
 * 선택적 인증 미들웨어 (인증 정보가 있으면 검증, 없어도 통과)
 */
const optionalAuth = (req, res, next) => {
  try {
    const devFlag = process.env.DEV_FLAG || '1';

    // DEV_FLAG가 1이면 인증 스킵
    if (devFlag === '1') {
      req.user = {
        userId: 'dev-user',
        isDev: true
      };
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    
    req.user = {
      userId: decoded.userId,
      isDev: false
    };
    
    next();
  } catch (error) {
    // 선택적 인증이므로 에러가 나도 통과
    req.user = null;
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth
};

