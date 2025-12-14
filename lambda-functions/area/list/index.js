// lambda-functions/area/list/index.js
const areaService = require('/opt/nodejs/shared/services/areaService');

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
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    // OPTIONS 요청 처리 (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
      return createResponse(200, {});
    }

    console.log('📍 Area List 요청');

    // 서비스 호출
    const areas = areaService.getAllAreas();

    // HATEOAS 링크
    const links = {
      self: { href: '/areas' },
      categories: { href: '/areas/categories' }
    };

    console.log(`✅ 응답: ${areas.length}개 지역`);
    return createResponse(200, successResponse({
      items: areas,
      total: areas.length
    }, null, links));

  } catch (error) {
    console.error('❌ Area List 오류:', error);
    return createResponse(500, errorResponse(error));
  }
};
