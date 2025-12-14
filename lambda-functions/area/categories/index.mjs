// area-categories Lambda 함수
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { categories } = require('/opt/nodejs/areas-data');

export const handler = async (event) => {
  // CORS 헤더
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  };

  // OPTIONS 요청 처리 (CORS preflight)
  const httpMethod = event.requestContext?.http?.method || event.httpMethod || event.requestContext?.httpMethod;
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const links = {
      self: { href: "/api/areas/categories" },
      all: { href: "/api/areas" }
    };

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: categories,
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