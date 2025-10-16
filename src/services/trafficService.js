// 교통 혼잡도 비즈니스 로직
class TrafficService {
  async getTrafficData() {
    // 나중에 공공 API 연동
    // 지금은 임시 데이터
    return [
      { line: "2호선", station: "강남역", congestion: "매우혼잡", level: 5 },
      { line: "2호선", station: "홍대입구역", congestion: "혼잡", level: 4 },
      { line: "1호선", station: "서울역", congestion: "보통", level: 3 },
      { line: "3호선", station: "교대역", congestion: "여유", level: 2 },
    ];
  }
}

module.exports = new TrafficService();
