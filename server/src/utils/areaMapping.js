const fs = require('fs');
const path = require('path');

/**
 * areacode.csv 파일을 파싱하여 POI 코드 매핑 정보를 제공하는 유틸리티
 */

class AreaMapping {
  constructor() {
    this.areas = [];
    this.areaMap = new Map();
    this.loadAreaData();
  }

  /**
   * CSV 파일을 읽어 메모리에 로드
   */
  loadAreaData() {
    try {
      const csvPath = path.join(__dirname, '../../areacode.csv');
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvContent.split('\n');

      // 첫 줄(헤더) 제외
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = line.split(',');
        if (columns.length >= 5) {
          const area = {
            category: columns[0].trim(),
            no: parseInt(columns[1].trim()),
            areaCode: columns[2].trim(),
            areaName: columns[3].trim(),
            engName: columns[4].trim()
          };

          this.areas.push(area);
          this.areaMap.set(area.areaCode, area);
        }
      }

      console.log(`✅ Area mapping loaded: ${this.areas.length} areas`);
    } catch (error) {
      console.error('❌ Failed to load area mapping:', error.message);
      this.areas = [];
      this.areaMap = new Map();
    }
  }

  /**
   * 모든 지역 정보 조회
   */
  getAllAreas() {
    return this.areas;
  }

  /**
   * 특정 POI 코드로 지역 정보 조회
   */
  getAreaByCode(areaCode) {
    return this.areaMap.get(areaCode) || null;
  }

  /**
   * 카테고리별 지역 조회
   */
  getAreasByCategory(category) {
    return this.areas.filter(area => area.category === category);
  }

  /**
   * 지역명으로 검색
   */
  searchByName(searchTerm) {
    const term = searchTerm.toLowerCase();
    return this.areas.filter(area => 
      area.areaName.toLowerCase().includes(term) || 
      area.engName.toLowerCase().includes(term)
    );
  }

  /**
   * POI 코드가 유효한지 확인
   */
  isValidAreaCode(areaCode) {
    return this.areaMap.has(areaCode);
  }

  /**
   * 전체 카테고리 목록 조회
   */
  getCategories() {
    return [...new Set(this.areas.map(area => area.category))];
  }
}

// 싱글톤 인스턴스
const areaMappingInstance = new AreaMapping();

module.exports = areaMappingInstance;


