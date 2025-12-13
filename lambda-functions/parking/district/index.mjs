// lambda-functions/parking/district/index.js
const parkingService = require('/opt/nodejs/shared/services/parkingService.js');
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

    // Path 파라미터에서 district 추출
    let district = event.pathParameters?.district;
    district = decodeURIComponent(district);

    if (!district) {
      return createResponse(400, errorResponse(new Error('자치구 이름이 필요합니다.')));
    }

    console.log(`🏘️ Parking District 요청: ${district}`);

    // 서비스 호출
    const data = await parkingService.getParkingByDistrict(district);

    // HATEOAS 링크
    const links = {
      self: { href: `/parking/district/${district}` },
      all: { href: '/parking' }
    };

    console.log(`✅ 응답: ${district} - ${data.length}개 주차장`);
    return createResponse(200, successResponse(data, null, links));

  } catch (error) {
    console.error('❌ Parking District 오류:', error);
    
    const statusCode = error.message.includes('유효하지 않은') ? 400 : 500;
    return createResponse(statusCode, errorResponse(error));
  }
};