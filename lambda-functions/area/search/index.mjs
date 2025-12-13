// area-search Lambda 함수
// 지역명으로 검색

const areas = [
  { category: "관광특구", no: 1, areaCode: "POI001", areaName: "강남 MICE 관광특구", engName: "Gangnam MICE Special Tourist Zone" },
  { category: "관광특구", no: 2, areaCode: "POI002", areaName: "동대문 관광특구", engName: "Dongdaemun Special Tourist Zone" },
  { category: "관광특구", no: 3, areaCode: "POI003", areaName: "명동 관광특구", engName: "Myeongdong Special Tourist Zone" },
  { category: "관광특구", no: 4, areaCode: "POI004", areaName: "이태원 관광특구", engName: "Itaewon Special Tourist Zone" },
  { category: "관광특구", no: 5, areaCode: "POI005", areaName: "잠실 관광특구", engName: "Jamsil Special Tourist Zone" },
  { category: "고궁·문화유산", no: 6, areaCode: "POI006", areaName: "경복궁", engName: "Gyeongbokgung Palace" },
  { category: "고궁·문화유산", no: 7, areaCode: "POI007", areaName: "덕수궁", engName: "Deoksugung Palace" },
  { category: "고궁·문화유산", no: 8, areaCode: "POI008", areaName: "창덕궁·종묘", engName: "Changdeokgung Palace·Jongmyo Shrine" }
];

export const handler = async (event) => {
  try {
    // 검색어 가져오기 (API Gateway에서 전달됨)
    const q = event.queryStringParameters?.q || "";

    if (!q) {
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

    // 검색 실행
    const searchTerm = q.toLowerCase();
    const results = areas.filter(area =>
      area.areaName.toLowerCase().includes(searchTerm) ||
      area.engName.toLowerCase().includes(searchTerm)
    );

    // HATEOAS 링크
    const links = {
      self: { href: `/api/areas/search?q=${encodeURIComponent(q)}` },
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