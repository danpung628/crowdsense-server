// area-category Lambda 함수
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { areas } = require('/opt/nodejs/areas-data');

export const handler = async (event) => {
  try {
    const category = decodeURIComponent(event.pathParameters?.category || '');
    
    const results = areas.filter(area => area.category === category);

    const links = {
      self: { href: `/api/areas/category/${encodeURIComponent(category)}` },
      all: { href: "/api/areas" },
      categories: { href: "/api/areas/categories" }
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