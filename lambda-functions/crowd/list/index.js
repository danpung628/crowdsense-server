// lambda-functions/crowd/list/index.js
const crowdService = require('/opt/nodejs/shared/services/crowdService');
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
    console.log('📊 Crowd List 요청:', JSON.stringify(event.queryStringParameters));

    // OPTIONS 요청 처리 (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
      return createResponse(200, {});
    }

    // 쿼리 파라미터 파싱
    const queryParams = event.queryStringParameters || {};
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 20;
    const category = queryParams.category;
    const sort = queryParams.sort;
    const order = queryParams.order || 'asc';

    // 서비스 호출
    let allData = await crowdService.getCrowdData();

    // 필터링: category
    if (category) {
      allData = allData.filter(item => 
        item.areaInfo?.category === category
      );
    }

    // 정렬
    if (sort) {
      allData.sort((a, b) => {
        let aVal, bVal;

        // 중첩된 속성 접근 처리 (예: areaInfo.areaName)
        if (sort.includes('.')) {
          const keys = sort.split('.');
          aVal = keys.reduce((obj, key) => obj?.[key], a) || 0;
          bVal = keys.reduce((obj, key) => obj?.[key], b) || 0;
        } else {
          aVal = a[sort] || 0;
          bVal = b[sort] || 0;
        }

        // 문자열인 경우 localeCompare 사용
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

    // HATEOAS 링크 생성
    const baseUrl = '/crowds';
    const queryString = new URLSearchParams();
    if (category) queryString.set('category', category);
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
    console.error('❌ Crowd List 오류:', error);
    return createResponse(500, errorResponse(error));
  }
};