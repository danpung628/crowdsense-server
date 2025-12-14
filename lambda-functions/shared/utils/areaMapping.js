/**
 * areacode.csv 파일을 파싱하여 POI 코드 매핑 정보를 제공하는 유틸리티
 * Lambda Layer에서는 파일 시스템 접근이 제한적이므로, 
 * 데이터를 코드에 포함시키거나 S3에서 로드하는 방식 사용
 */

class AreaMapping {
  constructor() {
    this.areas = [];
    this.areaMap = new Map();
    this.loadAreaData();
  }

  /**
   * CSV 파일을 읽어 메모리에 로드
   * Lambda 환경에서는 파일 경로가 다를 수 있으므로 여러 경로 시도
   */
  loadAreaData() {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // 가능한 경로들 시도
      const possiblePaths = [
        '/opt/nodejs/shared/areacode.csv', // Lambda Layer 경로 (nodejs/shared 구조)
        path.join(__dirname, '../../../areacode.csv'),
        path.join(__dirname, '../../../../areacode.csv'),
        path.join(process.cwd(), 'areacode.csv'),
        '/opt/areacode.csv' // Lambda Layer 경로 (구버전 호환)
      ];

      let csvPath = null;
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          csvPath = possiblePath;
          break;
        }
      }

      if (!csvPath) {
        console.warn('⚠️ areacode.csv 파일을 찾을 수 없습니다. 기본 데이터 사용');
        this.loadDefaultData();
        return;
      }

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
      this.loadDefaultData();
    }
  }

  /**
   * 기본 데이터 로드 (파일 로드 실패 시)
   */
  loadDefaultData() {
    // POI001 ~ POI128 기본 데이터 생성
    const categories = ['관광지', '쇼핑', '음식', '문화', '교통', '기타'];
    for (let i = 1; i <= 128; i++) {
      const areaCode = `POI${String(i).padStart(3, '0')}`;
      const area = {
        category: categories[i % categories.length],
        no: i,
        areaCode,
        areaName: `지역 ${i}`,
        engName: `Area ${i}`
      };
      this.areas.push(area);
      this.areaMap.set(areaCode, area);
    }
    console.log(`✅ Default area mapping loaded: ${this.areas.length} areas`);
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

