# CrowdSense API 가이드

## 개요

서울시 인구 밀집도, 지하철 혼잡도, 주차장 가용 정보를 제공하는 RESTful API 서버입니다.

## 🎯 핵심 기능

1. **실시간 인파 밀집도** - Redis 캐싱으로 빠른 조회
2. **인파 변화 추이** - MongoDB 히스토리 데이터 기반 통계
3. **인기 장소 랭킹** - 평균 인구수 기준 실시간 랭킹
4. **지하철 혼잡도** - 실시간 승하차 인원 정보
5. **주차장 정보** - 실시간 가용 현황 및 주변 검색
6. **위치 기반 추천** - 좌표 기반 주변 주차장 추천

## 환경 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`env.example` 파일을 참고하여 `.env` 파일을 생성하세요.

```bash
# Server Configuration
PORT=3000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/crowdsense

# Redis Configuration
REDIS_URL=redis://127.0.0.1:6379

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# Development Flag (1=인증 불필요, 0=인증 필요)
DEV_FLAG=1

# Seoul Open API Configuration
SEOUL_API_KEY=47464b765073696c33366142537a7a
SEOUL_POPULATION_API_URL=http://openapi.seoul.go.kr:8088
SEOUL_SUBWAY_API_KEY=your-subway-api-key
SEOUL_PARKING_API_KEY=your-parking-api-key
```

### 3. 서버 실행

```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

## API 엔드포인트

### 인증 (Authentication)

#### 회원가입
```http
POST /api/auth/register
Content-Type: application/json

{
  "id": "user123",
  "password": "password123"
}
```

#### 로그인
```http
POST /api/auth/login
Content-Type: application/json

{
  "id": "user123",
  "password": "password123"
}
```

**응답:**
```json
{
  "success": true,
  "message": "로그인이 완료되었습니다.",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "userId": "user123"
}
```

#### 로그아웃
```http
POST /api/auth/logout
Authorization: Bearer {accessToken}
```

#### 토큰 갱신
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 사용자 정보 조회
```http
GET /api/auth/me
Authorization: Bearer {accessToken}
```

---

### 인구 밀집도 (Crowds)

#### 전체 인구 밀집도 조회
```http
GET /api/crowds
```

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "areaCode": "POI001",
      "areaInfo": {
        "category": "관광특구",
        "no": 1,
        "areaCode": "POI001",
        "areaName": "강남 MICE 관광특구",
        "engName": "Gangnam MICE Special Tourist Zone"
      },
      "data": {
        // 서울시 도시데이터 API 응답
      },
      "fetchedAt": "2025-10-21T12:34:56.789Z"
    }
  ]
}
```

#### 특정 지역 인구 밀집도 조회
```http
GET /api/crowds/{areaCode}
```

**예시:**
```http
GET /api/crowds/POI001
```

---

### 지하철 혼잡도 (Subway)

#### 전체 지하철 혼잡도 조회
```http
GET /api/subway
```

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "stationId": "S001",
      "stationName": "강남역",
      "line": "2호선",
      "congestion": "매우혼잡",
      "level": 5,
      "updatedAt": "2025-10-21T12:34:56.789Z"
    }
  ]
}
```

#### 특정 역 혼잡도 조회
```http
GET /api/subway/{stationId}
```

**예시:**
```http
GET /api/subway/S001
```

---

### 주차장 정보 (Parking)

#### 전체 주차장 정보 조회
```http
GET /api/parking
```

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "parkingId": "P001",
      "name": "강남역 공영주차장",
      "available": 45,
      "total": 100,
      "fee": 3000,
      "address": "서울시 강남구 역삼동",
      "latitude": 37.497942,
      "longitude": 127.027621,
      "updatedAt": "2025-10-21T12:34:56.789Z"
    }
  ]
}
```

#### 특정 주차장 정보 조회
```http
GET /api/parking/{parkingId}
```

**예시:**
```http
GET /api/parking/P001
```

---

### 지역 정보 (Areas)

#### 전체 지역 코드 조회
```http
GET /api/areas
```

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "category": "관광특구",
      "no": 1,
      "areaCode": "POI001",
      "areaName": "강남 MICE 관광특구",
      "engName": "Gangnam MICE Special Tourist Zone"
    }
  ]
}
```

#### 특정 지역 코드 조회
```http
GET /api/areas/{areaCode}
```

**예시:**
```http
GET /api/areas/POI001
```

#### 카테고리 목록 조회
```http
GET /api/areas/categories
```

**응답:**
```json
{
  "success": true,
  "data": [
    "관광특구",
    "고궁·문화유산",
    "인구밀집지역",
    "발달상권",
    "공원"
  ]
}
```

#### 카테고리별 지역 조회
```http
GET /api/areas/category/{category}
```

**예시:**
```http
GET /api/areas/category/관광특구
```

#### 지역명 검색
```http
GET /api/areas/search?q={searchTerm}
```

**예시:**
```http
GET /api/areas/search?q=강남
```

---

## 에러 응답 형식

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지"
  }
}
```

### 주요 에러 코드

- `MISSING_TOKEN` (401): 인증 토큰이 필요합니다
- `INVALID_TOKEN` (401): 유효하지 않은 토큰
- `TOKEN_EXPIRED` (401): 토큰이 만료됨
- `VALIDATION_ERROR` (400): 입력값 검증 실패
- `DUPLICATE_ERROR` (400): 중복된 데이터
- `INTERNAL_ERROR` (500): 서버 내부 오류

---

## DEV_FLAG 설정

개발 편의를 위해 `DEV_FLAG` 환경변수를 제공합니다:

- **DEV_FLAG=1**: 모든 API를 인증 없이 사용 가능 (개발 모드)
- **DEV_FLAG=0**: JWT 토큰 인증 필수 (프로덕션 모드)

---

## 데이터 캐싱

- Redis를 사용하여 60초 TTL로 데이터 캐싱
- 인구 밀집도 데이터는 60초마다 자동 갱신 (폴링)
- 캐시 미스 시 즉시 API 호출하여 데이터 제공

---

## 프로젝트 구조

```
crowdsense-server/
├── src/
│   ├── controllers/      # 요청 처리 로직
│   │   ├── authController.js
│   │   ├── crowdController.js
│   │   ├── subwayController.js
│   │   ├── parkingController.js
│   │   └── areaController.js
│   ├── models/          # 데이터베이스 모델
│   │   └── User.js
│   ├── routes/          # API 라우트 정의
│   │   ├── authRoutes.js
│   │   ├── crowdRoutes.js
│   │   ├── subwayRoutes.js
│   │   ├── parkingRoutes.js
│   │   └── areaRoutes.js
│   ├── services/        # 비즈니스 로직
│   │   ├── authService.js
│   │   ├── crowdService.js
│   │   ├── subwayService.js
│   │   └── parkingService.js
│   ├── middlewares/     # 미들웨어
│   │   └── authMiddleware.js
│   └── utils/           # 유틸리티
│       ├── areaMapping.js
│       ├── errorHandler.js
│       ├── jwtUtils.js
│       └── redisClient.js
├── areacode.csv         # POI 코드 매핑 데이터
├── server.js            # 서버 진입점
├── package.json
└── env.example          # 환경변수 예시
```

---

## 라이선스

ISC

