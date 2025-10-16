// 실제 비즈니스 로직
class CrowdService {
  async getCrowdData() {
    // 나중에 여기서 공공 API 호출
    // 지금은 임시 데이터
    return [
      { location: "강남역", congestion: "높음", people: 5000 },
      { location: "홍대입구역", congestion: "보통", people: 3000 },
      { location: "명동", congestion: "낮음", people: 1500 },
    ];
  }
}

module.exports = new CrowdService();
