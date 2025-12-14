// lambda-functions/subway/list/index.js
const subwayService = require('/opt/nodejs/shared/services/subwayService');
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
    console.log('🚇 Subway List 요청:', JSON.stringify(event.queryStringParameters));

    if (event.httpMethod === 'OPTIONS') {
      return createResponse(200, {});
    }

    // 쿼리 파라미터 파싱
    const queryParams = event.queryStringParameters || {};
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 20;
    const sort = queryParams.sort;
    const order = queryParams.order || 'asc';

    // 서비스 호출
    let allData = await subwayService.getSubwayData();

    // 정렬
    if (sort) {
      allData.sort((a, b) => {
        const aVal = a[sort] || 0;
        const bVal = b[sort] || 0;

        if (typeof aVal === 'string') {
          return order === 'desc' 
            ? bVal.localeCompare(aVal) 
            : aVal.localeCompare(bVal);
        }

        return order === 'desc' ? bVal - aVal : aVal - bVal;
      });
    }

    // 페이지네이션
    const total = allData.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const data = allData.slice(skip, skip + limit);

    // HATEOAS 링크
    const baseUrl = '/subway';
    const queryString = new URLSearchParams();
    if (sort) queryString.set('sort', sort);
    if (order !== 'asc') queryString.set('order', order);
    queryString.set('limit', limit.toString());

    const links = {
      self: { href: `${baseUrl}?page=${page}&${queryString}` },
      first: { href: `${baseUrl}?page=1&${queryString}` },
      last: { href: `${baseUrl}?page=${totalPages}&${queryString}` }
    };

    if (page > 1) {
      links.prev = { href: `${baseUrl}?page=${page - 1}&${queryString}` };
    }
    if (page < totalPages) {
      links.next = { href: `${baseUrl}?page=${page + 1}&${queryString}` };
    }

    // 응답 데이터
    const response = {
      items: data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };

    console.log(`✅ 응답: ${data.length}개 항목 (전체: ${total})`);
    return createResponse(200, successResponse(response, null, links));

  } catch (error) {
    console.error('❌ Subway List 오류:', error);
    return createResponse(500, errorResponse(error));
  }
};