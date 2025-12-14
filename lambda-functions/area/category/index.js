// lambda-functions/area/category/index.js
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

    // Path 파라미터에서 category 추출
    let category = event.pathParameters?.category;
    category = decodeURIComponent(category);

    if (!category) {
      return createResponse(400, errorResponse(new Error('카테고리가 필요합니다.')));
    }

    console.log(`📂 Area Category 요청: ${category}`);

    // 서비스 호출
    const results = areaService.getAreasByCategory(category);

    // HATEOAS 링크
    const links = {
      self: { href: `/areas/category/${encodeURIComponent(category)}` },
      all: { href: '/areas' },
      categories: { href: '/areas/categories' }
    };

    console.log(`✅ 응답: ${category} - ${results.length}개 지역`);
    return createResponse(200, successResponse({
      items: results,
      total: results.length
    }, null, links));

  } catch (error) {
    console.error('❌ Area Category 오류:', error);
    return createResponse(500, errorResponse(error));
  }
};
