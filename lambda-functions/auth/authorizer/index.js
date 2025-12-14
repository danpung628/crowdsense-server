/**
 * API Gateway Lambda Authorizer
 * JWT 토큰을 검증하고 사용자 정보를 반환
 */

const { verifyAccessToken } = require('/opt/nodejs/shared/utils/jwtUtils.js');

/**
 * Lambda Authorizer 핸들러
 * @param {Object} event - API Gateway Authorizer 이벤트
 * @returns {Object} IAM 정책 문서
 */
exports.handler = async (event) => {
  console.log('🔐 Authorizer 이벤트:', JSON.stringify(event, null, 2));

  try {
    // Authorization 토큰 추출
    const token = extractToken(event);
    
    if (!token) {
      console.log('❌ 토큰 없음');
      return generatePolicy('user', 'Deny', event.methodArn);
    }

    // JWT 토큰 검증
    const decoded = verifyAccessToken(token);
    console.log('✅ 토큰 검증 성공:', decoded.userId);

    // IAM 정책 생성 (Allow)
    const policy = generatePolicy(decoded.userId, 'Allow', event.methodArn);
    
    // 컨텍스트에 사용자 정보 추가 (Lambda 함수에서 사용 가능)
    policy.context = {
      userId: decoded.userId,
      email: decoded.email || '',
      role: decoded.role || 'user'
    };

    return policy;
  } catch (error) {
    console.error('❌ Authorizer 오류:', error);
    return generatePolicy('user', 'Deny', event.methodArn);
  }
};

/**
 * 이벤트에서 토큰 추출
 */
function extractToken(event) {
  // Authorization 헤더에서 추출
  const authHeader = event.authorizationToken || event.headers?.Authorization || event.headers?.authorization;
  
  if (!authHeader) {
    return null;
  }

  // "Bearer " 접두사 제거
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return authHeader;
}

/**
 * IAM 정책 문서 생성
 * @param {string} principalId - 사용자 ID
 * @param {string} effect - 'Allow' 또는 'Deny'
 * @param {string} resource - API Gateway 리소스 ARN
 */
function generatePolicy(principalId, effect, resource) {
  const authResponse = {
    principalId: principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource
        }
      ]
    }
  };

  return authResponse;
}
