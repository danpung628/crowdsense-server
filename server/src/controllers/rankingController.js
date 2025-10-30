const rankingService = require("../services/rankingService");
const { successResponse, errorResponse } = require("../utils/errorHandler");

// 인기 장소 랭킹 조회
exports.getPopularPlaces = async (req, res) => {
  try {
    const { category, hours } = req.query;
    const hoursValue = parseInt(hours) || 24;
    const data = await rankingService.getPopularPlaces(
      null, // limit을 null로 전달하여 모든 데이터 반환
      category || null,
      hoursValue
    );
    
    // HATEOAS 링크
    const baseUrl = '/api/rankings/popular';
    const queryParams = new URLSearchParams();
    if (category) queryParams.set('category', category);
    queryParams.set('hours', hoursValue);
    
    const queryString = queryParams.toString();
    const links = {
      self: { href: `${baseUrl}${queryString ? '?' + queryString : ''}` },
      areas: { href: '/api/areas' },
      crowds: { href: '/api/crowds' }
    };
    
    if (category) {
      links.category = { href: `/api/areas/category/${encodeURIComponent(category)}` };
    }
    
    res.json(successResponse(data, null, links));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
};

