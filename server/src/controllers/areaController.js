const areaMapping = require("../utils/areaMapping");
const { successResponse, errorResponse } = require("../utils/errorHandler");

// 전체 지역 코드 매핑 조회
exports.getAllAreas = async (req, res) => {
  try {
    const allData = areaMapping.getAllAreas();
    
    // HATEOAS 링크
    const baseUrl = '/api/areas';
    const links = {
      self: { href: baseUrl },
      categories: { href: `${baseUrl}/categories` }
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

// 특정 지역 코드 정보 조회
exports.getAreaByCode = async (req, res) => {
  try {
    const { areaCode } = req.params;
    const data = areaMapping.getAreaByCode(areaCode);
    
    if (!data) {
      return res.status(404).json(errorResponse({
        message: `지역 코드를 찾을 수 없습니다: ${areaCode}`
      }));
    }
    
    // HATEOAS 링크
    const links = {
      self: { href: `/api/areas/${areaCode}` },
      crowd: { href: `/api/crowds/${areaCode}` },
      subway: { href: `/api/subway/${areaCode}` },
      all: { href: '/api/areas' }
    };
    
    if (data.category) {
      links.category = { href: `/api/areas/category/${encodeURIComponent(data.category)}` };
    }
    
    res.json(successResponse(data, null, links));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
};

// 카테고리 목록 조회
exports.getCategories = async (req, res) => {
  try {
    const data = areaMapping.getCategories();
    
    // HATEOAS 링크
    const links = {
      self: { href: '/api/areas/categories' },
      all: { href: '/api/areas' }
    };
    
    res.json(successResponse(data, null, links));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
};

// 카테고리별 지역 조회
exports.getAreasByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const data = areaMapping.getAreasByCategory(category);
    
    // HATEOAS 링크
    const links = {
      self: { href: `/api/areas/category/${encodeURIComponent(category)}` },
      all: { href: '/api/areas' },
      categories: { href: '/api/areas/categories' }
    };
    
    res.json(successResponse(data, null, links));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
};

// 지역명으로 검색
exports.searchAreas = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json(errorResponse({
        message: '검색어(q)가 필요합니다.'
      }));
    }
    
    const data = areaMapping.searchByName(q);
    
    // HATEOAS 링크
    const links = {
      self: { href: `/api/areas/search?q=${encodeURIComponent(q)}` },
      all: { href: '/api/areas' }
    };
    
    res.json(successResponse(data, null, links));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
};


