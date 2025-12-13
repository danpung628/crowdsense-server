// area-categories Lambda 함수
// 카테고리 목록 조회

const categories = [
  "관광특구",
  "고궁·문화유산",
  "인구밀집지역",
  "발달상권",
  "공원"
];

export const handler = async (event) => {
  try {
    // HATEOAS 링크
    const links = {
      self: { href: "/api/areas/categories" },
      all: { href: "/api/areas" }
    };

    const responseData = {
      success: true,
      data: categories,
      _links: links
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(responseData)
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