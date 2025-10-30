const subwayService = require("../services/subwayService");
const { successResponse, errorResponse } = require("../utils/errorHandler");

// 전체 지하철 혼잡도 조회
exports.getAllSubway = async (req, res) => {
  try {
    // 쿼리 파라미터 파싱
    const sort = req.query.sort;
    const order = req.query.order || 'asc';
    
    let allData = await subwayService.getSubwayData();
    
    // 정렬
    if (sort) {
      allData.sort((a, b) => {
        const aVal = a[sort] || 0;
        const bVal = b[sort] || 0;
        
        if (typeof aVal === 'string') {
          return order === 'desc' 
            ? bVal.localeCompare(aVal) 
            : aVal.localeCompare(bVal);
        }
        
        return order === 'desc' ? bVal - aVal : aVal - bVal;
      });
    }
    
    // HATEOAS 링크
    const baseUrl = '/api/subway';
    const queryParams = new URLSearchParams();
    if (sort) queryParams.set('sort', sort);
    if (order !== 'asc') queryParams.set('order', order);
    
    const queryString = queryParams.toString();
    const links = {
      self: { href: `${baseUrl}${queryString ? '?' + queryString : ''}` }
    };
    
    // 응답 데이터
    const response = {
      items: allData,
      total: allData.length
    };
    
    res.json(successResponse(response, null, links));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
};

// 특정 지역의 지하철 혼잡도 조회
exports.getSubwayByAreaCode = async (req, res) => {
  try {
    const { areaCode } = req.params;
    const data = await subwayService.getSubwayDataByAreaCode(areaCode);
    
    // HATEOAS 링크
    const links = {
      self: { href: `/api/subway/${areaCode}` },
      crowd: { href: `/api/crowds/${areaCode}` },
      area: { href: `/api/areas/${areaCode}` },
      all: { href: '/api/subway' }
    };
    
    res.json(successResponse(data, null, links));
  } catch (error) {
    const statusCode = error.message.includes('유효하지 않은') ? 404 : 500;
    res.status(statusCode).json(errorResponse(error));
  }
};


