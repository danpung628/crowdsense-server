# AWS 서버리스 마이그레이션 설계 계획

> ⚠️ **중요**: 이 문서는 **현재 프로젝트 상태가 아니라**, Express 서버에서 AWS 서버리스 구조로 **전환할 계획**을 정리한 설계서입니다.
> 
> - **현재 상태**: Express.js 기반 모놀리식 서버 (`server/server.js`)
> - **목표 상태**: AWS Lambda + API Gateway 기반 서버리스 아키텍처

---

## 📋 프로젝트 개요

### 목적
서울시 인파 밀집도, 지하철 혼잡도, 주차장 가용 정보를 실시간으로 제공하는 웹 애플리케이션

### 주요 기능
- 실시간 지역별 인파 밀집도 조회
- 실시간 교통 혼잡도 정보 조회
- 실시간 주차장 현황 및 가용성 정보
- 즐겨찾기 기능

---

## 🏗️ 시스템 아키텍처

### 전체 아키텍처 (AWS 서버리스 기반)
- **API Gateway**: RESTful API 엔드포인트 관리
- **Lambda**: 서버리스 함수 실행
- **MongoDB Atlas**: NoSQL 데이터베이스
- **ElastiCache (Redis)**: 캐시
- **S3 + CloudFront**: 프론트엔드 배포 및 CDN

### 마이크로서비스 구조

**6개 서비스 도메인, 19개 Lambda 함수**

| 엔드포인트 접두사 | Lambda 서비스 | Lambda 함수 개수 | 주요 기능 |
|-----------------|--------------|----------------|----------|
| `/api/auth/*` | authService | 5개 | 회원가입, 로그인/로그아웃, 토큰 갱신 |
| `/api/crowds/*` | crowdService | 3개 | 인파 데이터/히스토리 조회 |
| `/api/subway/*` | subwayService | 2개 | 지하철 혼잡도 조회 |
| `/api/parking/*` | ParkingService | 3개 | 주차장 현황/주변 검색 |
| `/api/rankings/*` | RankingService | 1개 | 인기 장소 랭킹 |
| `/api/areas/*` | AreaService | 5개 | 지역 정보 조회 |

**Lambda 함수 상세:**
- **AuthService**: register, login, logout, refresh, me (5개)
- **CrowdService**: list, detail, history (3개)
- **SubwayService**: list, detail (2개)
- **ParkingService**: list, nearby, district (3개)
- **RankingService**: popular (1개)
- **AreaService**: list, categories, search, category, detail (5개)

---

## 🛠️ 기술 스택

### 프론트엔드
- React 18 + TypeScript
- Vite (빌드 도구)
- Tailwind CSS
- React Router v6
- PWA 지원

### 백엔드 (AWS 서버리스)
- **API Gateway**: Amazon API Gateway
- **서버리스**: Amazon Lambda (Node.js 20.x)
- **언어**: JavaScript/TypeScript
- **데이터베이스**: MongoDB Atlas
- **캐시**: Amazon ElastiCache (Redis)
- **인증**: JWT (JSON Web Token)

### AWS 인프라 서비스
- API Gateway: RESTful API 엔드포인트 관리
- Lambda: 서버리스 함수 실행
- MongoDB Atlas: NoSQL 데이터베이스
- ElastiCache: Redis 캐시
- S3: 정적 파일 저장 (프론트엔드 배포)
- CloudFront: CDN (콘텐츠 전송)
- IAM: 접근 제어 및 권한 관리
- CloudWatch: 로깅 및 모니터링

### 개발 도구
- **버전 관리**: Git
- **로컬 개발**: AWS SAM (Serverless Application Model)

---

## 💾 데이터베이스 설계

### MongoDB Atlas 스키마

#### User 컬렉션
- `_id`: ObjectId (MongoDB 자동 생성)
- `id`: String (unique, required, indexed)
- `password`: String (hashed, required)
- `accessToken`: String
- `refreshToken`: String
- `createdAt`: Date (indexed)
- `updatedAt`: Date

#### CrowdHistory 컬렉션
- `_id`: ObjectId (MongoDB 자동 생성)
- `areaCode`: String (required, indexed)
- `areaName`: String (required)
- `category`: String (required)
- `peopleCount`: Number (default: 0)
- `congestionLevel`: Number (min: 1, max: 5, default: 3)
- `rawData`: Mixed (optional)
- `timestamp`: Date (required, indexed, TTL: 30일)

**인덱스 전략**:
1. `areaCode`: 단일 인덱스 (지역별 조회 최적화)
2. `timestamp`: TTL 인덱스 (30일 후 자동 삭제)
3. `{areaCode: 1, timestamp: -1}`: 복합 인덱스 (지역별 시계열 조회 최적화)
4. `{category: 1, peopleCount: -1, timestamp: -1}`: 복합 인덱스 (카테고리별 랭킹 조회 최적화)

### Redis 캐시 구조 (Amazon ElastiCache)

#### 인파 데이터 캐시
- **Key**: `crowd:{areaCode}`
- **TTL**: 600초 (10분)
- **Value 구조**:
```json
{
  "areaCode": "String",
  "areaInfo": {
    "category": "String",
    "areaCode": "String",
    "areaName": "String",
    "engName": "String"
  },
  "data": "Object (서울시 API 원본 응답)",
  "fetchedAt": "String (ISO date-time)"
}
```

#### 주차장 데이터 캐시
- **Key**: `parking:{district}`
- **TTL**: 600초 (10분)
- **Value 구조**:
```json
[{
  "parkingId": "String",
  "code": "String",
  "name": "String",
  "district": "String",
  "address": "String",
  "type": "String",
  "operationType": "String",
  "tel": "String | null",
  "total": "Number",
  "current": "Number",
  "available": "Number",
  "isAvailable": "boolean",
  "isPaidParking": "boolean",
  "rates": {
    "basic": {"fee": "Number", "time": "Number"},
    "additional": {"fee": "Number", "time": "Number"},
    "dayMax": "Number"
  },
  "operatingHours": {
    "weekday": "String",
    "weekend": "String",
    "holiday": "String"
  },
  "nightFree": "boolean",
  "coordinates": {
    "latitude": "Number | null",
    "longitude": "Number | null"
  },
  "lastUpdated": "String",
  "updatedAt": "String"
}]
```

#### 지하철 혼잡도 캐시
- **Key**: `subway:{areaCode}`
- **TTL**: 600초 (10분)
- **Value 구조**:
```json
{
  "areaCode": "String",
  "areaInfo": {
    "category": "String",
    "areaCode": "String",
    "areaName": "String",
    "engName": "String"
  },
  "subway": "Object (서울시 API 원본 응답)",
  "fetchedAt": "String (ISO date-time)"
}
```

---

## 🔌 API 설계 (RESTful API)

### Base URL
`https://{api-id}.execute-api.{region}.amazonaws.com/{stage}`

### 인증 API (`/api/auth/*`)

| 메서드 | 엔드포인트 | Lambda 함수 |
|--------|-----------|------------|
| POST | `/api/auth/register` | auth-register |
| POST | `/api/auth/login` | auth-login |
| POST | `/api/auth/logout` | auth-logout |
| POST | `/api/auth/refresh` | auth-refresh |
| GET | `/api/auth/me` | auth-me |

### 인파 데이터 API (`/api/crowds/*`)

| 메서드 | 엔드포인트 | Lambda 함수 |
|--------|-----------|------------|
| GET | `/api/crowds` | crowd-list |
| GET | `/api/crowds/{areaCode}` | crowd-detail |
| GET | `/api/crowds/{areaCode}/history` | crowd-history |

### 교통 데이터 API (`/api/subway/*`)

| 메서드 | 엔드포인트 | Lambda 함수 |
|--------|-----------|------------|
| GET | `/api/subway` | subway-list |
| GET | `/api/subway/{areaCode}` | subway-detail |

### 주차장 데이터 API (`/api/parking/*`)

| 메서드 | 엔드포인트 | Lambda 함수 |
|--------|-----------|------------|
| GET | `/api/parking` | parking-list |
| GET | `/api/parking/nearby?lat={lat}&lng={lng}&radius={radius}` | parking-nearby |
| GET | `/api/parking/district/{district}` | parking-district |

### 랭킹 API (`/api/rankings/*`)

| 메서드 | 엔드포인트 | Lambda 함수 |
|--------|-----------|------------|
| GET | `/api/rankings/popular` | ranking-popular |

### 지역 정보 API (`/api/areas/*`)

| 메서드 | 엔드포인트 | Lambda 함수 |
|--------|-----------|------------|
| GET | `/api/areas` | area-list |
| GET | `/api/areas/categories` | area-categories |
| GET | `/api/areas/search?q={query}` | area-search |
| GET | `/api/areas/category/{category}` | area-category |
| GET | `/api/areas/{areaCode}` | area-detail |

### API 응답 형식

**성공 응답**:
```json
{
  "success": true,
  "data": { ... },
  "message": "성공 메시지"
}
```

**에러 응답**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지"
  }
}
```

### 인증 방식
- JWT 기반 인증: Access Token 15분, Refresh Token 7일 유효
- 헤더: `Authorization: Bearer {token}`
- API Gateway Authorizer: Lambda Authorizer 사용 (선택)

---

## 📁 Lambda 함수 구조

**총 19개 Lambda 함수 (6개 서비스 도메인)**

```
lambda-functions/
├── shared/                    # 공통 레이어 (Lambda Layer)
│   ├── utils/
│   │   ├── errorHandler.js
│   │   ├── jwtUtils.js
│   │   ├── redisClient.js
│   │   ├── areaMapping.js
│   │   ├── districtCoordinates.js
│   │   └── s3Client.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── crowdService.js
│   │   ├── subwayService.js
│   │   ├── parkingService.js
│   │   ├── rankingService.js
│   │   └── areaService.js
│   ├── models/
│   │   ├── User.js
│   │   └── CrowdHistory.js
│   ├── middlewares/
│   │   └── authMiddleware.js
│   ├── data/
│   │   ├── parkingCoordinates.json
│   │   └── parkingCoordinatesLoader.js
│   └── config/
│
├── auth/
│   ├── register/index.js
│   ├── login/index.js
│   ├── logout/index.js
│   ├── refresh/index.js
│   └── me/index.js
│
├── crowd/
│   ├── list/index.js
│   ├── detail/index.js
│   └── history/index.js
│
├── subway/
│   ├── list/index.js
│   └── detail/index.js
│
├── parking/
│   ├── list/index.js
│   ├── nearby/index.js
│   └── district/index.js
│
├── ranking/
│   └── popular/index.js
│
└── area/
    ├── list/index.js
    ├── categories/index.js
    ├── search/index.js
    ├── category/index.js
    └── detail/index.js
```

### Lambda 함수 공통 구조

```javascript
exports.handler = async (event) => {
  try {
    // 1. 이벤트 파싱
    const { pathParameters, queryStringParameters, body } = event;
    
    // 2. 비즈니스 로직 실행
    const result = await businessLogic(...);
    
    // 3. 응답 반환
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: result
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: {
          code: error.code,
          message: error.message
        }
      })
    };
  }
};
```

---

## 🎨 프론트엔드 설계

### 반응형 웹앱 설계
- **Tailwind CSS**: 모바일 우선 반응형 디자인
- **Breakpoints**:
  - Mobile: < 640px
  - Tablet: 640px ~ 1024px
  - Desktop: > 1024px
- **PWA**: 모바일에서 앱처럼 사용 가능

### 페이지 구조
```
/ (Home)
├── /crowd (CrowdMap)
│   └── /crowd/:areaCode (CrowdDetail)
│   └── /history/:areaCode (HistoryView)
├── /subway (Subway)
├── /parking (Parking)
└── /popular (PopularPlaces)
```

### 모바일/PC 최적화

**모바일 최적화:**
- 터치 친화적 UI 디자인
- 하단 네비게이션 바
- 스와이프 제스처 지원
- PWA 설치 가능

**PC 최적화:**
- 사이드바 네비게이션
- 키보드 단축키 지원
- 마우스 호버 효과
- 넓은 화면 활용

### 컴포넌트 구조
```
src/
├── pages/           # 페이지 컴포넌트
├── components/      # 재사용 컴포넌트
├── api/            # API 통신
│   ├── client.ts   # Axios 인스턴스
│   ├── services.ts # API 서비스 함수
│   └── types.ts    # TypeScript 타입
├── contexts/       # Context API
└── App.tsx         # 메인 앱 컴포넌트
```

### 레이어 구조

**프론트엔드 레이어 구조:**
- **Presentation Layer**: Pages, Components (UI 컴포넌트)
- **Business Logic Layer**: Contexts, Hooks (상태 관리 및 비즈니스 로직)
- **Data Access Layer**: API Services, Client (API 통신)

**백엔드 레이어 구조:**
- **Route Layer**: API Routes (엔드포인트 정의)
- **Controller Layer**: Request/Response Handling (요청/응답 처리)
- **Service Layer**: Business Logic (비즈니스 로직)
- **Data Access Layer**: Models, External APIs (데이터 접근)

---

## 🔒 보안 설계

### 인증/인가
- JWT 기반 인증
- 비밀번호 해싱 (bcrypt)
- Refresh Token Rotation
- CORS 설정

### 데이터 보안
- 입력 데이터 검증
- SQL Injection 방지 (MongoDB 사용으로 자동 방지)
- XSS 방지 (React 자동 이스케이프)
- Rate Limiting

### API 보안
- HTTPS 사용 (프로덕션)
- API Key 관리 (환경 변수)
- 에러 메시지 노출 최소화

---

## 🚀 배포 설계

### 배포 아키텍처

| 구분 | AWS 서비스 |
|------|-----------|
| 프론트엔드 배포 | S3 버킷, CloudFront (CDN) |
| 백엔드 배포 | API Gateway, Lambda, CloudWatch |
| 데이터베이스 | MongoDB Atlas, ElastiCache (Redis) |

### 배포 프로세스

#### 프론트엔드 배포
1. 빌드: `npm run build` → `dist/` 폴더 생성
2. S3 업로드: `aws s3 sync dist/ s3://crowdsense-web/`
3. CloudFront 무효화: 캐시 갱신

#### Lambda 함수 배포
1. 코드 패키징: `sam build` 또는 `zip`
2. 의존성 설치: `npm install --production`
3. Lambda Layer 생성 (shared 폴더)
4. Lambda 함수 업로드
5. 환경 변수 설정 (Secrets Manager 연동)
6. API Gateway 연결
7. CloudWatch 알람 설정

### 환경 변수 관리
- MongoDB 연결 문자열
- Redis 연결 정보
- JWT 시크릿 키
- 외부 API 키

---

## ⚙️ AWS 서비스 활용 상세

### Lambda 함수 설계 원칙
- **단일 책임**: 각 Lambda 함수는 하나의 기능만 담당
- **독립성**: 함수 간 의존성 최소화
- **재사용성**: 공통 로직은 레이어(Layer)로 분리

### Lambda 레이어 활용
```
layers/
├── common/
│   └── nodejs/
│       ├── utils/
│       │   ├── errorHandler.js
│       │   ├── jwtUtils.js
│       │   ├── redisClient.js
│       │   └── areaMapping.js
│       ├── services/
│       │   ├── authService.js
│       │   ├── crowdService.js
│       │   ├── subwayService.js
│       │   ├── parkingService.js
│       │   ├── rankingService.js
│       │   └── areaService.js
│       ├── models/
│       │   ├── User.js
│       │   └── CrowdHistory.js
│       ├── middlewares/
│       │   └── authMiddleware.js
│       ├── data/
│       │   └── parkingCoordinates.json
│       └── config/
└── external-apis/
    └── nodejs/
        └── seoul-api-client.js
```

### API Gateway 설정

#### CORS 설정
```json
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}
```

#### Rate Limiting
- API Gateway Usage Plan: 기본 10,000 req/day
- Lambda 함수별: 분당 100회 제한
- Redis 기반 Rate Limiting (사용자별)

#### API 스테이지
- `dev`: 개발 환경
- `staging`: 스테이징 환경
- `prod`: 프로덕션 환경

### 성능 최적화

#### Lambda 최적화
- 콜드 스타트 최소화: 프로비저닝된 동시성 사용
- 레이어 활용으로 패키지 크기 감소
- 메모리 설정: 함수별 최적 메모리 할당
- 타임아웃 설정: 적절한 타임아웃 설정

#### 프론트엔드 최적화
- 코드 스플리팅
- Lazy loading
- 이미지 최적화
- 번들 크기 최적화

#### 데이터베이스 최적화
- 인덱스 최적화
- 쿼리 최적화
- ElastiCache 적극 활용

### 모니터링 및 로깅
- **CloudWatch 활용**:
  - Lambda 로그: CloudWatch Logs 자동 수집
  - 메트릭: 실행 시간, 에러율, 호출 횟수
  - 알람: 에러율 임계값 초과 시 알림

### 보안 강화
- **IAM 역할 및 정책**: 최소 권한 원칙
- **Secrets 관리**: Parameter Store 사용
- 환경 변수에 민감 정보 직접 저장 금지

---

## 🔄 마이그레이션 계획

### 현재 구조 (Express 서버)
- Express.js 기반 모놀리식 서버
- MongoDB + Redis를 로컬 또는 클라우드에서 사용
- 프론트엔드: React (Vite)

### AWS 서버리스 구조로 전환

#### Phase 1: Lambda 함수 개발
- Express 라우트를 Lambda 함수로 변환
- 각 API 엔드포인트를 독립 Lambda 함수로 분리

#### Phase 2: API Gateway 구성
- API Gateway에 엔드포인트 등록
- Lambda 함수와 연결

#### Phase 3: 데이터베이스 마이그레이션
- MongoDB → MongoDB Atlas로 전환
- Redis → ElastiCache로 전환

#### Phase 4: 프론트엔드 배포
- S3 + CloudFront로 배포
- Express 라우터 엔드포인트에서 API Gateway 엔드포인트로 연결

---

## 👥 팀 구성 및 역할

| 이름 | 역할 | 담당 업무 |
|------|------|----------|
| 서성덕 | 팀장, 백엔드 개발자 | AWS Lambda 함수 개발, API Gateway 설계 및 구성, RESTful API 설계 및 구현, 전체 아키텍처 설계, 인증 시스템 구현 (Lambda Authorizer), 서버리스 아키텍처 설계 |
| 김휘성 | 데이터 엔지니어 | 공공데이터 API 연동 (Lambda 함수), 데이터 전처리 및 변환, MongoDB Atlas 스키마 설계, Redis 캐싱 전략 (ElastiCache), Lambda 함수 내 데이터 처리 로직 |
| 노원우 | 풀스택 개발자 | Lambda 함수 보조 개발, 프론트엔드 보조, API 통신 로직, 데이터 바인딩, AWS 서비스 연동 보조 |
| 정일혁 | 프론트엔드 개발자 | React UI/UX 구현, 모바일/PC 반응형 디자인, PWA 기능 구현, 실시간 알림 구현, 프론트엔드 최적화, API Gateway 연동 |

---

## 📅 개발 일정

| 단계 | 기간 | 주요 업무 |
|------|------|----------|
| 설계 단계 | 2025년 11월 20일 | AWS 아키텍처, Lambda 함수, API Gateway, DB 설계 완료 및 설계 보고서 작성 |
| 구현 단계 | 2025년 12월 11일 | Lambda 함수 구현, API Gateway 구성, 프론트엔드 AWS 연동, 테스트 및 디버깅, 구현 보고서 작성 |

---

## 📝 참고사항

- 이 설계서는 **과제 요구사항**에 맞춰 작성된 **미래 계획**입니다
- 현재 프로젝트는 **Express 서버**로 동작 중이며, 이를 **AWS 서버리스 구조로 전환**하는 것이 목표입니다
- 모든 API 엔드포인트는 기존 Express 라우트와 동일하게 유지하되, Lambda 함수로 분리됩니다
- 백그라운드 폴링 작업은 EventBridge + Lambda로 전환 예정입니다

