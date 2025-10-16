// 주차장 정보 비즈니스 로직
class ParkingService {
  async getParkingData() {
    // 나중에 공공 API 연동
    // 지금은 임시 데이터
    return [
      { name: "강남역 공영주차장", available: 45, total: 100, fee: 3000 },
      { name: "홍대 공영주차장", available: 12, total: 80, fee: 2500 },
      { name: "명동 공영주차장", available: 5, total: 60, fee: 4000 },
      { name: "서울역 주차장", available: 0, total: 120, fee: 3500 },
    ];
  }
}

module.exports = new ParkingService();
