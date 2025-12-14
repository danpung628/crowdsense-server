// ranking-popular Lambda 함수
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { areas } = require('/opt/nodejs/areas-data');

export const handler = async (event) => {
  try {
    const category = event.queryStringParameters?.category;
    
    // 필터링 (카테고리 지정 시)
    let filteredAreas = category 
      ? areas.filter(a => a.category === category)
      : areas;

    // 목업 랭킹 데이터 생성 (실제로는 crowd 데이터 기반)
    const rankings = filteredAreas.slice(0, 10).map((area, index) => ({
      rank: index + 1,
      areaCode: area.areaCode,
      areaName: area.areaName,
      category: area.category,
      avgPopulation: Math.floor(Math.random() * 10000) + 1000,
      congestionLevel: Math.floor(Math.random() * 5) + 1
    }));

    const links = {
      self: { href: "/api/rankings/popular" },
      areas: { href: "/api/areas" }
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        success: true,
        data: rankings,
        total: rankings.length,
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