// area-categories Lambda 함수
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { categories } = require('/opt/nodejs/areas-data');

export const handler = async (event) => {
  try {
    const links = {
      self: { href: "/api/areas/categories" },
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
        data: categories,
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