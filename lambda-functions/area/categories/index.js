// lambda-functions/area/categories/index.js
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

    console.log('📂 Area Categories 요청');

    // 서비스 호출
    const categories = areaService.getCategories();

    // HATEOAS 링크
    const links = {
      self: { href: '/areas/categories' },
      all: { href: '/areas' }
    };

    console.log(`✅ 응답: ${categories.length}개 카테고리`);
    return createResponse(200, successResponse(categories, null, links));

  } catch (error) {
    console.error('❌ Area Categories 오류:', error);
    return createResponse(500, errorResponse(error));
  }
};
