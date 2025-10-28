const rankingService = require("../services/rankingService");
const { successResponse, errorResponse } = require("../utils/errorHandler");

// 인기 장소 랭킹 조회
exports.getPopularPlaces = async (req, res) => {
  try {
    const { limit, category, hours } = req.query;
    const limitValue = parseInt(limit) || 10;
    const hoursValue = parseInt(hours) || 24;
    const data = await rankingService.getPopularPlaces(
      limitValue,
      category || null,
      hoursValue
    );
    
    // HATEOAS 링크
    const baseUrl = '/api/rankings/popular';
    const queryParams = new URLSearchParams();
    queryParams.set('limit', limitValue);
    if (category) queryParams.set('category', category);
    queryParams.set('hours', hoursValue);
    
    const links = {
      self: { href: `${baseUrl}?${queryParams.toString()}` },
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

