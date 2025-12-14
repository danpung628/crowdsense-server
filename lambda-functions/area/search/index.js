// lambda-functions/area/search/index.js
const areaService = require('/opt/nodejs/shared/services/areaService');

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

function successResponse(data, message = null, links = null) {
  return {
    success: true,
    data,
    message,
    ...(links && { _links: links })
  };
}

function errorResponse(error) {
  return {
    success: false,
    error: error.message || '알 수 없는 오류가 발생했습니다.',
    timestamp: new Date().toISOString()
  };
}

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    if (event.httpMethod === 'OPTIONS') {
      return createResponse(200, {});
    }

    // 쿼리 파라미터에서 검색어 추출
    const query = event.queryStringParameters?.q;

    if (!query) {
      return createResponse(400, errorResponse(new Error('검색어(q)가 필요합니다.')));
    }

    console.log(`🔍 Area Search 요청: ${query}`);

    // 서비스 호출
    const results = areaService.searchAreas(query);

    // HATEOAS 링크
    const links = {
      self: { href: `/areas/search?q=${encodeURIComponent(query)}` },
      all: { href: '/areas' }
    };

    console.log(`✅ 응답: ${results.length}개 결과`);
    return createResponse(200, successResponse({
      items: results,
      total: results.length
    }, null, links));

  } catch (error) {
    console.error('❌ Area Search 오류:', error);
    return createResponse(500, errorResponse(error));
  }
};
