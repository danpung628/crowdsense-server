// lambda-functions/crowd/history/index.js
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

    // 쿼리 파라미터에서 hours 추출
    const queryParams = event.queryStringParameters || {};
    const hours = parseInt(queryParams.hours) || 24;

    console.log(`📈 Crowd History 요청: ${areaCode}, ${hours}시간`);

    // 서비스 호출
    const data = await crowdService.getCrowdHistory(areaCode, hours);

    // HATEOAS 링크
    const links = {
      self: { href: `/crowds/${areaCode}/history?hours=${hours}` },
      current: { href: `/crowds/${areaCode}` },
      area: { href: `/areas/${areaCode}` },
      all: { href: '/crowds' }
    };

    console.log(`✅ 응답: ${areaCode} 히스토리 ${data.dataCount}개`);
    return createResponse(200, successResponse(data, null, links));

  } catch (error) {
    console.error('❌ Crowd History 오류:', error);
    return createResponse(500, errorResponse(error));
  }
};