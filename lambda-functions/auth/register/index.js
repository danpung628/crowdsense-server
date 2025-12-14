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

    if (id.length < 3 || id.length > 50) {
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
            message: '사용자 ID는 3-50자 사이여야 합니다.'
          }
        })
      };
    }

    if (password.length < 6) {
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
            message: '비밀번호는 최소 6자 이상이어야 합니다.'
          }
        })
      };
    }

    // 회원가입 처리
    const result = await authService.register(id, password);

    return {
      statusCode: 201,
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



