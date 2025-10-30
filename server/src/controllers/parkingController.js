const parkingService = require("../services/parkingService");
const { successResponse, errorResponse } = require("../utils/errorHandler");

// 전체 주차장 정보 조회
exports.getAllParking = async (req, res) => {
  try {
    // 쿼리 파라미터 파싱
    const district = req.query.district;
    const available = req.query.available; // 'true' or 'false'
    const sort = req.query.sort;
    const order = req.query.order || 'asc';
    
    let allData = await parkingService.getParkingData();
    
    // 필터링: district
    if (district) {
      allData = allData.filter(item => 
        item.district === district
      );
    }
    
    // 필터링: available (가용 주차면이 있는지)
    if (available === 'true') {
      allData = allData.filter(item => item.available > 0);
    } else if (available === 'false') {
      allData = allData.filter(item => item.available === 0);
    }
    
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
    const baseUrl = '/api/parking';
    const queryParams = new URLSearchParams();
    if (district) queryParams.set('district', district);
    if (available) queryParams.set('available', available);
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

// 자치구별 주차장 정보 조회
exports.getByDistrict = async (req, res) => {
  try {
    const { district } = req.params;
    const data = await parkingService.getParkingByDistrict(district);
    
    // HATEOAS 링크
    const links = {
      self: { href: `/api/parking/district/${district}` },
      all: { href: '/api/parking' }
    };
    
    res.json(successResponse(data, null, links));
  } catch (error) {
    const statusCode = error.message.includes('유효하지 않은') ? 400 : 500;
    res.status(statusCode).json(errorResponse(error));
  }
};

// 주변 주차장 추천
exports.getNearbyParking = async (req, res) => {
  try {
    const { lat, lng, radius, unit } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json(errorResponse({
        message: '위도(lat)와 경도(lng)가 필요합니다.'
      }));
    }
    
    let radiusValue = parseFloat(radius);
    // 기본 반경: 1km
    if (Number.isNaN(radiusValue)) {
      radiusValue = 1;
    }
    // 단위 처리: unit=m 이면 미터로 들어온 값을 km로 변환
    // 또는 값이 충분히 크면(> 50) 미터로 간주하여 km로 변환
    if ((unit && unit.toLowerCase() === 'm') || radiusValue > 50) {
      radiusValue = radiusValue / 1000;
    }
    const data = await parkingService.findNearbyParking(
      parseFloat(lat),
      parseFloat(lng),
      radiusValue
    );
    
    // HATEOAS 링크
    const links = {
      self: { href: `/api/parking/nearby?lat=${lat}&lng=${lng}&radius=${radiusValue}&unit=km` },
      all: { href: '/api/parking' }
    };
    
    res.json(successResponse(data, null, links));
  } catch (error) {
    res.status(500).json(errorResponse(error));
  }
};
