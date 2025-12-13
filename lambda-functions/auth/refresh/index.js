const authService = require('/opt/nodejs/shared/services/authService.js');
const { handleLambdaError } = require('/opt/nodejs/shared/utils/errorHandler.js');

exports.handler = async (event) => {
  try {
    // 요청 본문 파싱
    const body = JSON.parse(event.body || '{}');
    const { refreshToken } = body;

    // 입력값 검증
    if (!refreshToken) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Refresh token이 필요합니다.'
          }
        })
      };
    }

    // 토큰 갱신 처리
    const result = await authService.refreshTokens(refreshToken);

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
    // 토큰 갱신 실패는 401로 처리
    if (errorResponse.statusCode === 500 && error.message.includes('토큰 갱신 실패')) {
      errorResponse.statusCode = 401;
    }
    return {
      ...errorResponse,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
};

