const authService = require('/opt/nodejs/shared/services/authService.js');
const { handleLambdaError } = require('/opt/nodejs/shared/utils/errorHandler.js');

exports.handler = async (event) => {
  try {
    // 요청 본문 파싱
    const body = JSON.parse(event.body || '{}');
    const { id, password } = body;

    // 입력값 검증
    if (!id || !password) {
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
            message: '사용자 ID와 비밀번호를 모두 입력해주세요.'
          }
        })
      };
    }

    // 로그인 처리
    const result = await authService.login(id, password);

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
    // 로그인 실패는 401로 처리
    if (errorResponse.statusCode === 500 && error.message.includes('로그인 실패')) {
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

