// lambda-functions/area/detail/index.js
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

    // Path 파라미터에서 areaCode 추출
    const areaCode = event.pathParameters?.areaCode;

    if (!areaCode) {
      return createResponse(400, errorResponse(new Error('지역 코드가 필요합니다.')));
    }

    console.log(`📍 Area Detail 요청: ${areaCode}`);

    // 서비스 호출
    const area = areaService.getAreaByCode(areaCode);

    // HATEOAS 링크
    const links = {
      self: { href: `/areas/${areaCode}` },
      all: { href: '/areas' },
      category: { href: `/areas/category/${encodeURIComponent(area.category)}` }
    };

    console.log(`✅ 응답: ${areaCode} 데이터`);
    return createResponse(200, successResponse(area, null, links));

  } catch (error) {
    console.error('❌ Area Detail 오류:', error);
    
    const statusCode = error.message.includes('찾을 수 없습니다') ? 404 : 500;
    return createResponse(statusCode, errorResponse(error));
  }
};
