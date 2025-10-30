const crowdService = require("../services/crowdService");
const { successResponse, errorResponse } = require("../utils/errorHandler");

// 전체 인구 밀집도 조회
exports.getAllCrowds = async (req, res) => {
  try {
    // 쿼리 파라미터 파싱
    const category = req.query.category;
    const sort = req.query.sort;
    const order = req.query.order || 'asc';
    
    let allData = await crowdService.getCrowdData();
    
    // 필터링: category
    if (category) {
      allData = allData.filter(item => 
        item.areaInfo?.category === category
      );
    }
    
    // 정렬
    if (sort) {
      allData.sort((a, b) => {
        let aVal, bVal;
        
        // 중첩된 속성 접근 처리
        if (sort.includes('.')) {
          const keys = sort.split('.');
          aVal = keys.reduce((obj, key) => obj?.[key], a) || 0;
          bVal = keys.reduce((obj, key) => obj?.[key], b) || 0;
        } else {
          aVal = a[sort] || 0;
          bVal = b[sort] || 0;
        }
        
        // 문자열인 경우 localeCompare 사용
        if (typeof aVal === 'string') {
          return order === 'desc' 
            ? bVal.localeCompare(aVal) 
            : aVal.localeCompare(bVal);
        }
        
        return order === 'desc' ? bVal - aVal : aVal - bVal;
      });
    }
    
    // HATEOAS 링크
    const baseUrl = '/api/crowds';
    const queryParams = new URLSearchParams();
    if (category) queryParams.set('category', category);
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

// 특정 지역의 인구 밀집도 조회
exports.getCrowdByAreaCode = async (req, res) => {
  try {
    const { areaCode } = req.params;
    const data = await crowdService.getCrowdDataByAreaCode(areaCode);
    
    // HATEOAS 링크
    const links = {
      self: { href: `/api/crowds/${areaCode}` },
      history: { href: `/api/crowds/${areaCode}/history` },
      area: { href: `/api/areas/${areaCode}` },
      all: { href: '/api/crowds' }
    };
    
    res.json(successResponse(data, null, links));
  } catch (error) {
    const statusCode = error.message.includes('유효하지 않은') ? 404 : 500;
    res.status(statusCode).json(errorResponse(error));
  }
};

// 인파 변화 추이 조회 (히스토리)
exports.getCrowdHistory = async (req, res) => {
  try {
    const { areaCode } = req.params;
    const { hours } = req.query;
    const hoursValue = parseInt(hours) || 24;
    const data = await crowdService.getCrowdHistory(areaCode, hoursValue);
    
    // HATEOAS 링크
    const links = {
      self: { href: `/api/crowds/${areaCode}/history?hours=${hoursValue}` },
      current: { href: `/api/crowds/${areaCode}` },
      area: { href: `/api/areas/${areaCode}` },
      all: { href: '/api/crowds' }
    };
    
    res.json(successResponse(data, null, links));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
};
