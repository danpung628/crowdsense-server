# CrowdSense

서울시 인파 밀집도, 지하철 혼잡도, 주차장 가용 정보를 제공하는 웹 애플리케이션

## 프로젝트 구조

```
crowdsense-server/
├── client/          # 클라이언트 애플리케이션 (추후 개발)
│   └── README.md
└── server/          # 서버 애플리케이션 (RESTful API)
    ├── src/
    │   ├── config/       # 설정 파일 (Swagger 등)
    │   ├── controllers/  # 요청 처리 컨트롤러
    │   ├── middlewares/  # 미들웨어 (인증 등)
    │   ├── models/       # MongoDB 모델
    │   ├── routes/       # API 라우트
    │   ├── services/     # 비즈니스 로직
    │   └── utils/        # 유틸리티 함수
    ├── areacode.csv     # 서울시 지역 코드 매핑 데이터
    ├── server.js        # 서버 엔트리 포인트
    ├── package.json     # 의존성 관리
    ├── env.example      # 환경 변수 예제
    ├── .env             # 환경 변수 (직접 생성 필요)
    ├── README.md        # 서버 README
    └── API_GUIDE.md     # API 상세 가이드
```

## 빠른 시작

### 1. 서버 디렉토리로 이동

```bash
cd server
```

### 2. 환경 변수 설정

```bash
# env.example을 참고하여 .env 파일 생성
cp env.example .env
# .env 파일 편집하여 필요한 값 입력
```

**필수 환경 변수:**
- `MONGODB_URI`: MongoDB 연결 URI
- `REDIS_HOST`: Redis 호스트 (기본: localhost)
- `REDIS_PORT`: Redis 포트 (기본: 6379)
- `JWT_SECRET`: JWT 서명 비밀키
- `JWT_REFRESH_SECRET`: JWT 리프레시 토큰 비밀키
- `SEOUL_API_KEY`: 서울시 공공데이터 API 키
- `SEOUL_API_URL`: 서울시 API 기본 URL
- `DEV_FLAG`: 개발 모드 (1: 인증 비활성화, 0: 인증 활성화)

### 3. 의존성 설치

```bash
npm install
```

### 4. MongoDB와 Redis 실행

서버를 실행하기 전에 MongoDB와 Redis가 실행 중이어야 합니다.

**MongoDB:**
- 로컬: MongoDB 서비스 시작
- 클라우드: MongoDB Atlas 등의 URI 사용

**Redis:**
- Windows: Redis for Windows 실행
- Linux/Mac: `redis-server` 명령어로 실행
- Docker: `docker run -d -p 6379:6379 redis`

### 5. 서버 실행

```bash
# 개발 모드 (nodemon - 파일 변경 시 자동 재시작)
npm run dev

# 프로덕션 모드
npm start
```

### 6. API 문서 확인

서버 실행 후 브라우저에서 접속:

```
http://localhost:3000/api-docs
```

## 주요 기능

### 서버 (RESTful API)

1. **인파 밀집도 API** (`/api/crowds`)
   - 실시간 지역별 인파 밀집도 조회
   - 인파 변화 추이 및 통계 (MongoDB 기반 시계열 데이터)

2. **지하철 혼잡도 API** (`/api/subway`)
   - 실시간 지하철역별 혼잡도 조회 (Redis 캐싱)

3. **주차장 정보 API** (`/api/parking`)
   - 실시간 주차장 가용 정보 (요청 시 조회)
   - 좌표 기반 주변 주차장 추천 (Haversine 공식)

4. **랭킹 API** (`/api/rankings`)
   - 인기 장소 랭킹 (MongoDB Aggregation)

5. **지역 정보 API** (`/api/areas`)
   - 서울시 POI 지역 코드 조회
   - 카테고리별 조회, 검색 기능

6. **인증 API** (`/api/auth`)
   - 회원가입, 로그인
   - JWT Access Token / Refresh Token
   - 토큰 갱신

### 클라이언트

추후 개발 예정 (`client/` 디렉토리)

## 기술 스택

### 서버
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Cache**: Redis
- **Authentication**: JWT (Access Token + Refresh Token)
- **Documentation**: Swagger UI (OpenAPI 3.0)
- **External API**: 서울시 공공데이터 API (인구, 지하철, 주차장)

### 데이터 처리
- **실시간 데이터**: Redis 캐싱 (60초 폴링)
- **히스토리 데이터**: MongoDB (10분 간격 저장, 7일 보관)
- **데이터 분석**: MongoDB Aggregation Pipeline

## API 문서

### Swagger UI
서버 실행 후 다음 URL에서 대화형 API 문서 확인:

```
http://localhost:3000/api-docs
```

### 상세 가이드
`server/API_GUIDE.md` 파일에서 각 API의 상세 사용법 확인 가능

## 개발 모드

개발 중에는 `.env` 파일에서 `DEV_FLAG=1`로 설정하여 인증을 비활성화할 수 있습니다:

```env
DEV_FLAG=1  # 인증 없이 모든 API 사용 가능 (개발용)
```

**⚠️ 주의**: 프로덕션 환경에서는 반드시 `DEV_FLAG=0`으로 설정하세요.

## 인증

### DEV_FLAG=0 (프로덕션)
- 회원가입 (`POST /api/auth/register`) - 인증 불필요
- 로그인 (`POST /api/auth/login`) - 인증 불필요
- **그 외 모든 API** - JWT Access Token 필요

### 인증 방법

1. 회원가입 또는 로그인하여 Access Token 획득
2. 요청 헤더에 토큰 포함:
   ```
   Authorization: Bearer <access_token>
   ```
3. Swagger UI에서는 우측 상단 "Authorize" 버튼 클릭하여 토큰 입력

## 팀원 가이드

### 팀원들이 설정해야 할 것

1. **Node.js 설치** (v18 이상 권장)

2. **MongoDB 설치 또는 MongoDB Atlas 계정**
   - 로컬: https://www.mongodb.com/try/download/community
   - 클라우드: https://www.mongodb.com/cloud/atlas

3. **Redis 설치**
   - Windows: https://github.com/microsoftarchive/redis/releases
   - Mac: `brew install redis`
   - Linux: `sudo apt-get install redis-server`

4. **서울시 공공데이터 API 키 발급**
   - https://data.seoul.go.kr/
   - 회원가입 후 API 신청

5. **프로젝트 클론 및 설정**
   ```bash
   git clone <repository-url>
   cd crowdsense-server/server
   cp env.example .env
   # .env 파일 편집 (API 키, DB URI 등 입력)
   npm install
   npm run dev
   ```

6. **서버 상태 확인**
   - Postman 또는 Swagger UI 사용 권장
   - Swagger UI: http://localhost:3000/api-docs

## 트러블슈팅

### MongoDB 연결 오류
```
Error: MongoDB connection failed
```
→ MongoDB 서비스가 실행 중인지 확인하거나 `.env`의 `MONGODB_URI` 확인

### Redis 연결 오류
```
Error: Redis connection failed
```
→ Redis 서버가 실행 중인지 확인하거나 `.env`의 `REDIS_HOST`, `REDIS_PORT` 확인

### API 키 오류
```
Error: Failed to fetch data from Seoul API
```
→ `.env`의 `SEOUL_API_KEY`와 `SEOUL_API_URL` 확인

### 401 Unauthorized 오류
→ `DEV_FLAG=1`로 설정하거나 로그인하여 토큰 획득 후 사용

## 라이선스

ISC
