# CrowdSense 서버 설정 가이드

## 🚀 빠른 시작

### 1. 환경 변수 설정

`.env` 파일 생성:

```env
# 서버 포트
PORT=3000

# MongoDB 연결
MONGODB_URI=mongodb://localhost:27017/crowdsense

# Redis 연결
REDIS_HOST=localhost
REDIS_PORT=6379

# 서울시 API
SEOUL_API_KEY=47464b765073696c33366142537a7a
SEOUL_POPULATION_API_URL=http://openapi.seoul.go.kr:8088

# 인증 (개발 모드)
DEV_FLAG=1
JWT_SECRET=your_jwt_secret_key_here
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 서버 시작

```bash
npm run dev
```

## 📊 초기 설정 확인

서버 시작 시 다음 로그가 표시됩니다:

```
✅ MongoDB 연결 성공
   - URI: mongodb://localhost:27017/crowdsense
   - Database: crowdsense

📊 CrowdService 초기화: 128개 지역, 히스토리 주기: 60초

🚀 주차장 좌표 생성 중...
📍 강남구 처리 중...
  ✅ 강남역 공영주차장: 강남구 역삼동 716-2 → (37.500123, 127.036456)
  ...
✅ 주차장 좌표 파일 생성 완료: 178개

🚀 CrowdSense 서버 시작!
   - 주소: http://localhost:3000
   - API 문서: http://localhost:3000/api-docs

⏱ 백그라운드 작업 시작...
⏱ Crowd data polling started (every 60s)
⏱ Subway data polling started (every 60s)
✅ 폴링 시작 완료
```

## 🧪 기능 테스트

### 1. MongoDB 히스토리 저장 확인

서버 시작 후 1분마다 다음 로그가 표시됩니다:

```
📝 MongoDB 히스토리 저장 시작 (총 128개 지역)
💾 히스토리 저장: POI001 - 1234명 (레벨 2)
💾 히스토리 저장: POI002 - 5678명 (레벨 3)
✅ 히스토리 저장 완료: 128/128개 지역
```

MongoDB에서 확인:

```bash
# MongoDB 접속
mongosh crowdsense

# 히스토리 데이터 확인
db.crowdhistories.find().sort({timestamp: -1}).limit(5)
```

### 2. 주차장 좌표 확인

API 요청:

```bash
GET http://localhost:3000/api/parking/district/강남구
```

응답:

```json
{
  "success": true,
  "data": [
    {
      "parkingId": "P-강남구-0",
      "name": "강남역 공영주차장",
      "district": "강남구",
      "address": "강남구 역삼동 716-2",
      "latitude": 37.500123,
      "longitude": 127.036456,
      "total": 100,
      "available": 45
    }
  ]
}
```

### 3. 주변 주차장 검색

API 요청:

```bash
GET http://localhost:3000/api/parking/nearby?lat=37.4979&lng=127.0276&radius=2
```

응답:

```json
{
  "success": true,
  "data": [
    {
      "parkingId": "P-강남구-12",
      "name": "역삼동 공영주차장",
      "distance": 0.85,
      "latitude": 37.500123,
      "longitude": 127.036456
    }
  ],
  "metadata": {
    "searchCenter": { "lat": 37.4979, "lng": 127.0276 },
    "radius": 2,
    "totalResults": 15
  }
}
```

## 🔧 문제 해결

### 주차장 좌표가 생성되지 않음

파일을 삭제하고 서버 재시작:

```bash
rm src/data/parkingCoordinates.json
npm run dev
```

### MongoDB 히스토리가 저장되지 않음

1. MongoDB 연결 확인:
```bash
mongosh crowdsense
```

2. 로그 확인:
- `📝 MongoDB 히스토리 저장 시작` 메시지가 1분마다 출력되는지 확인
- 에러 메시지가 있는지 확인

3. 히스토리 저장 주기 확인 (`src/services/crowdService.js`):
```javascript
this.historyInterval = 1 * 60 * 1000; // 1분마다 (테스트용)
// 운영 시: 10 * 60 * 1000 (10분마다)
```

### Redis 연결 실패

Redis 서버 시작:

```bash
# Windows (Memurai)
net start memurai

# Linux/Mac
redis-server
```

## 📁 생성되는 파일

- `src/data/parkingCoordinates.json` - 178개 주차장 좌표 (약 50KB)
- MongoDB `crowdhistories` 컬렉션 - 128개 지역 × 주기별 히스토리

## 🔗 API 엔드포인트

### Crowd (인구 밀집도)
- `GET /api/crowds/realtime` - 실시간 데이터
- `GET /api/crowds/trends` - 트렌드 데이터

### Parking (주차장)
- `GET /api/parking/district/:district` - 구별 주차장
- `GET /api/parking/nearby` - 주변 주차장

### Subway (지하철)
- `GET /api/subway/realtime` - 실시간 혼잡도

### Rankings (순위)
- `GET /api/rankings/popular` - 인기 장소 순위

자세한 API 문서: http://localhost:3000/api-docs

