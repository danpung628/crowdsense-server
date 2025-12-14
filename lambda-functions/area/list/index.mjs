// area-list Lambda 함수
// Layer에서 데이터 가져오기
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { areas } = require('/opt/nodejs/areas-data');

export const handler = async (event) => {
  // CORS 헤더
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  };

  // OPTIONS 요청 처리 (CORS preflight)
  // API Gateway v1: event.httpMethod
  // API Gateway v2: event.requestContext.http.method
  const httpMethod = event.requestContext?.http?.method || event.httpMethod || event.requestContext?.httpMethod;
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // HATEOAS 링크
    const links = {
      self: { href: "/api/areas" },
      categories: { href: "/api/areas/categories" }
    };

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: {
          items: areas,
          total: areas.length
        },
        _links: links
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};