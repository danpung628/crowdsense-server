// lambda-functions/crowd/detail/index.js
const crowdService = require('/opt/nodejs/shared/services/crowdService.js');
/**
 * HTTP 응답 생성 헬퍼
 */
function createResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

/**
 * 성공 응답 생성
 */
function successResponse(data, message = null, links = null) {
  return {
    success: true,
    data,
    message,
    ...(links && { _links: links })
  };
}

/**
 * 에러 응답 생성
 */
function errorResponse(error) {
  return {
    success: false,
    error: error.message || '알 수 없는 오류가 발생했습니다.',
    timestamp: new Date().toISOString()
  };
}

/**
 * Lambda 핸들러
 */
exports.handler = async (event, context) => {
  // MongoDB 연결 재사용을 위한 설정
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    // OPTIONS 요청 처리 (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
      return createResponse(200, {});
    }

    // Path 파라미터에서 areaCode 추출
    const areaCode = event.pathParameters?.areaCode;

    if (!areaCode) {
      return createResponse(400, errorResponse(new Error('지역 코드가 필요합니다.')));
    }

    console.log(`📍 Crowd Detail 요청: ${areaCode}`);

    // 서비스 호출
    const data = await crowdService.getCrowdDataByAreaCode(areaCode);

    // HATEOAS 링크
    const links = {
      self: { href: `/crowds/${areaCode}` },
      history: { href: `/crowds/${areaCode}/history` },
      area: { href: `/areas/${areaCode}` },
      all: { href: '/crowds' }
    };

    console.log(`✅ 응답: ${areaCode} 데이터`);
    return createResponse(200, successResponse(data, null, links));

  } catch (error) {
    console.error('❌ Crowd Detail 오류:', error);
    
    // 유효하지 않은 지역 코드 → 404
    const statusCode = error.message.includes('유효하지 않은') ? 404 : 500;
    return createResponse(statusCode, errorResponse(error));
  }
};