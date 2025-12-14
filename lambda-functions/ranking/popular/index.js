// lambda-functions/ranking/popular/index.js
const rankingService = require('/opt/nodejs/shared/services/rankingService');

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

    // 쿼리 파라미터 추출
    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit) || 10;
    const category = queryParams.category || null;
    const hours = parseInt(queryParams.hours) || 24;

    console.log(`🏆 Ranking Popular 요청: limit=${limit}, category=${category}, hours=${hours}`);

    // 서비스 호출
    const rankings = await rankingService.getPopularPlaces(limit, category, hours);

    // HATEOAS 링크
    const links = {
      self: { href: `/rankings/popular?limit=${limit}${category ? `&category=${encodeURIComponent(category)}` : ''}${hours !== 24 ? `&hours=${hours}` : ''}` },
      areas: { href: '/areas' }
    };

    console.log(`✅ 응답: ${rankings.length}개 랭킹`);
    return createResponse(200, successResponse({
      items: rankings,
      total: rankings.length
    }, null, links));

  } catch (error) {
    console.error('❌ Ranking Popular 오류:', error);
    return createResponse(500, errorResponse(error));
  }
};
