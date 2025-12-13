// lambda-functions/parking/nearby/index.js
const crowdService = require('/opt/nodejs/shared/services/crowdService.js');
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
    console.log('📍 Parking Nearby 요청:', JSON.stringify(event.queryStringParameters));

    if (event.httpMethod === 'OPTIONS') {
      return createResponse(200, {});
    }

    // 쿼리 파라미터 추출
    const queryParams = event.queryStringParameters || {};
    const { lat, lng, radius } = queryParams;

    if (!lat || !lng) {
      return createResponse(400, errorResponse({
        message: '위도(lat)와 경도(lng)가 필요합니다.'
      }));
    }

    const radiusValue = parseFloat(radius) || 1;
    
    console.log(`🔍 검색: lat=${lat}, lng=${lng}, radius=${radiusValue}km`);

    // 서비스 호출
    const data = await parkingService.findNearbyParking(
      parseFloat(lat),
      parseFloat(lng),
      radiusValue
    );

    // HATEOAS 링크
    const links = {
      self: { href: `/parking/nearby?lat=${lat}&lng=${lng}&radius=${radiusValue}` },
      all: { href: '/parking' }
    };

    console.log(`✅ 응답: ${data.length}개 주차장`);
    return createResponse(200, successResponse(data, null, links));

  } catch (error) {
    console.error('❌ Parking Nearby 오류:', error);
    return createResponse(500, errorResponse(error));
  }
};