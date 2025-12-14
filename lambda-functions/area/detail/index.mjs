// area-detail Lambda 함수
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { areas } = require('/opt/nodejs/areas-data');

export const handler = async (event) => {
  try {
    const areaCode = event.pathParameters?.areaCode || '';
    
    const area = areas.find(a => a.areaCode === areaCode);

    if (!area) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          success: false,
          error: `지역 코드를 찾을 수 없습니다: ${areaCode}`
        })
      };
    }

    const links = {
      self: { href: `/api/areas/${areaCode}` },
      all: { href: "/api/areas" },
      category: { href: `/api/areas/category/${encodeURIComponent(area.category)}` }
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        success: true,
        data: area,
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