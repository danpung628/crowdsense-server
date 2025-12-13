// ranking-popular Lambda 함수
// 인기 장소 랭킹 조회

const rankings = [
  { rank: 1, areaCode: "POI003", areaName: "명동 관광특구", category: "관광특구", avgPeople: 12500, maxPeople: 18000, avgCongestion: 4.8 },
  { rank: 2, areaCode: "POI002", areaName: "동대문 관광특구", category: "관광특구", avgPeople: 11200, maxPeople: 16500, avgCongestion: 4.5 },
  { rank: 3, areaCode: "POI001", areaName: "강남 MICE 관광특구", category: "관광특구", avgPeople: 9800, maxPeople: 14000, avgCongestion: 4.2 },
  { rank: 4, areaCode: "POI005", areaName: "잠실 관광특구", category: "관광특구", avgPeople: 8900, maxPeople: 13500, avgCongestion: 4.0 },
  { rank: 5, areaCode: "POI006", areaName: "경복궁", category: "고궁·문화유산", avgPeople: 7500, maxPeople: 11000, avgCongestion: 3.8 },
  { rank: 6, areaCode: "POI004", areaName: "이태원 관광특구", category: "관광특구", avgPeople: 6800, maxPeople: 10500, avgCongestion: 3.5 },
  { rank: 7, areaCode: "POI007", areaName: "덕수궁", category: "고궁·문화유산", avgPeople: 5200, maxPeople: 8000, avgCongestion: 3.2 },
  { rank: 8, areaCode: "POI008", areaName: "창덕궁·종묘", category: "고궁·문화유산", avgPeople: 4100, maxPeople: 6500, avgCongestion: 2.9 }
];

export const handler = async (event) => {
  try {
    // 쿼리 파라미터 가져오기
    const category = event.queryStringParameters?.category || null;
    const hours = parseInt(event.queryStringParameters?.hours) || 24;

    // 카테고리 필터링
    let results = rankings;
    if (category) {
      results = rankings.filter(r => r.category === category);
    }

    // HATEOAS 링크
    const links = {
      self: { href: `/api/rankings/popular${category ? `?category=${encodeURIComponent(category)}` : ''}` },
      areas: { href: "/api/areas" },
      crowds: { href: "/api/crowds" }
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