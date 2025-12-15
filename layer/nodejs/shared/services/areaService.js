// 지역 정보 서비스
const areaMapping = require('../utils/areaMapping');

class AreaService {
  /**
   * 전체 지역 코드 매핑 조회
   */
  getAllAreas() {
    return areaMapping.getAllAreas();
  }

  /**
   * 특정 지역 코드 정보 조회
   */
  getAreaByCode(areaCode) {
    const data = areaMapping.getAreaByCode(areaCode);
    if (!data) {
      throw new Error(`지역 코드를 찾을 수 없습니다: ${areaCode}`);
    }
    return data;
  }

  /**
   * 카테고리 목록 조회
   */
  getCategories() {
    return areaMapping.getCategories();
  }

  /**
   * 카테고리별 지역 조회
   */
  getAreasByCategory(category) {
    return areaMapping.getAreasByCategory(category);
  }

  /**
   * 지역명으로 검색
   */
  searchAreas(searchTerm) {
    if (!searchTerm) {
      throw new Error('검색어가 필요합니다.');
    }
    const results = areaMapping.searchByName(searchTerm);
    if (!results || results.length === 0) {
      return [];
    }
    return results;
  }
}

module.exports = new AreaService();

