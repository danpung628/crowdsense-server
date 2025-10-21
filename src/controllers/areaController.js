const areaMapping = require("../utils/areaMapping");
const { successResponse, errorResponse } = require("../utils/errorHandler");

// 전체 지역 코드 매핑 조회
exports.getAllAreas = async (req, res) => {
  try {
    const data = areaMapping.getAllAreas();
    res.json(successResponse(data));
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
    
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
};

// 카테고리 목록 조회
exports.getCategories = async (req, res) => {
  try {
    const data = areaMapping.getCategories();
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
};

// 카테고리별 지역 조회
exports.getAreasByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const data = areaMapping.getAreasByCategory(category);
    res.json(successResponse(data));
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
    res.json(successResponse(data));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
};


