const authService = require('/opt/nodejs/shared/services/authService.js');
const { handleLambdaError } = require('/opt/nodejs/shared/utils/errorHandler.js');
const { verifyAccessToken } = require('/opt/nodejs/shared/utils/jwtUtils.js');
exports.handler = async (event) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: '인증 토큰이 필요합니다.'
          }
        })
      };
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    const userId = decoded.userId;

    // 로그아웃 처리
    const result = await authService.logout(userId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    const errorResponse = handleLambdaError(error);
    return {
      ...errorResponse,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
};

