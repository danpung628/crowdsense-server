// area-search Lambda 함수
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { areas } = require('/opt/nodejs/areas-data');

export const handler = async (event) => {
  try {
    const query = event.queryStringParameters?.q || '';
    
    if (!query) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          success: false,
          error: "검색어(q)가 필요합니다."
        })
      };
    }

    const searchTerm = query.toLowerCase();
    const results = areas.filter(area =>
      area.areaName.toLowerCase().includes(searchTerm) ||
      area.engName.toLowerCase().includes(searchTerm)
    );

    const links = {
      self: { href: `/api/areas/search?q=${encodeURIComponent(query)}` },
      all: { href: "/api/areas" }
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        success: true,
        data: results,
        total: results.length,
        _links: links
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};