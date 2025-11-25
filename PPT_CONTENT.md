# CrowdSense AWS 서버리스 아키텍처 설계

## Lambda + API Gateway 기반 마이크로서비스

**날짜:** 2025.11.27  

**팀:** 9팀 서성덕 김휘성 노원우 정일혁

---

## 팀 구성

### 서성덕
- **역할:** 팀장, 백엔드 개발자
- **담당:** AWS Lambda 함수 개발, API Gateway 설계 및 구성, 인증 시스템 구현, 전체 아키텍처 설계 및 조율

### 김휘성
- **역할:** 데이터 엔지니어
- **담당:** 공공데이터 API 연동, 데이터 전처리 및 변환, MongoDB Atlas 스키마 설계, Redis 캐싱 전략

### 노원우
- **역할:** 풀스택 개발자
- **담당:** Lambda 함수 개발 보조, 프론트엔드 보조, API 통신 로직, 데이터 바인딩, AWS 서비스 연동 보조

### 정일혁
- **역할:** 프론트엔드 개발자
- **담당:** React UI/UX 구현, 모바일/PC 반응형 디자인, PWA 기능 구현, 실시간 알림 구현, API Gateway 연동

---

## 프로젝트 개요

### 프로젝트 목적
- 서울시 인파 밀집도, 지하철 혼잡도, 주차장 가용 정보를 실시간으로 제공
- 시민들의 효율적인 이동 지원

### 대상 사용자
- 서울시 지역을 자주 이용하는 시민
- 대중교통 이용자
- 자가용 운전자

### 주요 기능
- 실시간 지역별 인파 밀집도 조회
- 실시간 교통 혼잡도 정보 조회
- 실시간 주차장 현황 및 가용성 정보
- 즐겨찾기 기능

---

## AWS 서버리스 아키텍처

### 핵심 구성 요소
- **Amazon Lambda:** 서버리스 함수 실행 (Node.js 20.x)
- **API Gateway:** 엔드포인트 관리
- **MongoDB Atlas:** NoSQL 종류의 데이터베이스
- **ElastiCache (Redis):** 캐싱 레이어
- **S3 + CloudFront:** S3에 배포된 프론트엔드를 CDN으로 전세계에 전달

---

## 아키텍처 흐름

- 사용자 → CloudFront (CDN) → S3 (프론트엔드)
- 사용자 → API Gateway → Lambda 함수들
- Lambda → MongoDB Atlas (영구 저장)
- Lambda → ElastiCache Redis (캐시)
- Lambda → 서울시 공공데이터 API
- CloudWatch (모니터링 및 로깅)

---

## 서버리스 장점

### 서버 관리 불필요
인프라 관리에 대한 부담 없이 비즈니스 로직에 집중

### 자동 스케일링
트래픽 변화에 따라 Lambda 함수 인스턴스 개수를 자동으로 확장 및 축소

### 사용량 기반 과금
실제 사용한 만큼만 비용 지불, 유휴 리소스 비용 제로

### 고가용성 보장
AWS 인프라를 통한 안정적인 서비스 제공

### 개발 속도 향상
인프라 구성 간소화로 빠른 개발 및 배포

---

## 마이크로서비스 아키텍처
### 6개 서비스 도메인, 19개 Lambda 함수

#### AuthService (인증)
- **5개 Lambda 함수**
- register, login, logout, refresh, me

#### CrowdService (인파 데이터)
- **3개 Lambda 함수**
- list, detail, history

#### SubwayService (지하철 혼잡도)
- **2개 Lambda 함수**
- list, detail

#### ParkingService (주차장 정보)
- **3개 Lambda 함수**
- list, nearby, district

#### RankingService (인기 장소)
- **1개 Lambda 함수**
- popular

#### AreaService (지역 정보)
- **5개 Lambda 함수**
- list, categories, search, category, detail

---

## 마이크로서비스의 장점

### 독립적인 배포 및 확장
각 서비스를 독립적으로 배포하고 확장 가능

### 서비스별 장애 격리
한 서비스의 장애가 전체 시스템에 영향을 주지 않음

### 기술 스택 유연성
서비스별로 최적의 기술 선택 가능

### 팀별 병렬 개발 가능
여러 팀이 동시에 독립적으로 개발 진행

---

## Lambda 함수 설계

### 함수 분리 원칙

#### 단일 책임
각 Lambda 함수는 하나의 기능만 담당

#### 독립성
함수 간 의존성 최소화

#### 재사용성
공통 로직은 레이어(Layer)로 분리

### Lambda 함수 구조

#### shared/ (공통 레이어)
- **utils/:** errorHandler, jwtUtils, redisClient, areaMapping
- **services/:** authService, crowdService, subwayService, parkingService
- **models/:** User, CrowdHistory
- **middlewares/:** authMiddleware
- **data/:** parkingCoordinates
- **config/:** 환경 설정

#### 각 도메인별 Lambda 함수
- **auth/:** register, login, logout, refresh, me
- **crowd/:** list, detail, history
- **subway/:** list, detail
- **parking/:** list, nearby, district
- **ranking/:** popular
- **area/:** list, categories, search, category, detail

---

## Lambda Layer 활용

### common layer
utils, services, models, middlewares, data, config

### external-apis layer
seoul-api-client

**Lambda Layer를 활용하면** 공통 코드를 재사용하고, 배포 패키지 크기를 줄이며, 함수 간 일관성을 유지할 수 있습니다.

---

## RESTful API 설계 (1/2)

**Base URL:** https://{api-id}.execute-api.{region}.amazonaws.com/{stage}

### 인증 API (/api/auth/*)
- POST /api/auth/register - 회원가입
- POST /api/auth/login - 로그인
- POST /api/auth/logout - 로그아웃
- POST /api/auth/refresh - 토큰 갱신
- GET /api/auth/me - 내 정보 조회

### 인파 데이터 API (/api/crowds/*)
- GET /api/crowds - 전체 인파 데이터 목록
- GET /api/crowds/{areaCode} - 특정 지역 상세 정보
- GET /api/crowds/{areaCode}/history - 히스토리 조회

### 교통 데이터 API (/api/subway/*)
- GET /api/subway - 전체 지하철 혼잡도
- GET /api/subway/{areaCode} - 특정 역 상세 정보

---

## RESTful API 설계 (2/2)

### 주차장 데이터 API (/api/parking/*)
- GET /api/parking - 전체 주차장 목록
- GET /api/parking/nearby?lat={lat}&lng={lng}&radius={radius}
- GET /api/parking/district/{district} - 구별 주차장 조회

### 랭킹 API (/api/rankings/*)
- GET /api/rankings/popular - 인기 장소 랭킹

### 지역 정보 API (/api/areas/*)
- GET /api/areas - 전체 지역 목록
- GET /api/areas/categories - 카테고리 목록
- GET /api/areas/search?q={query} - 지역 검색
- GET /api/areas/category/{category} - 카테고리별 지역
- GET /api/areas/{areaCode} - 특정 지역 상세

### API 응답 형식

**성공:**
```
{success: true, data: {...}, message: "..."}
```

**에러:**
```
{success: false, error: {code: "...", message: "..."}}
```

---

## API Gateway 설정

### CORS 설정
- Access-Control-Allow-Origin: *
- Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
- Access-Control-Allow-Headers: Content-Type, Authorization

### Rate Limiting
- API Gateway Usage Plan: 기본 10,000 req/day
- Lambda 함수별: 분당 100회 제한
- Redis 기반 Rate Limiting (사용자별)

### API 스테이지
- **dev:** 개발 환경
- **staging:** 스테이징 환경
- **prod:** 프로덕션 환경

### 인증 방식
- JWT 기반 인증
- Access Token: 15분 유효
- Refresh Token: 7일 유효
- 헤더: Authorization: Bearer {token}
- Lambda Authorizer 사용

---

## MongoDB Atlas 스키마

### User 컬렉션

#### 필드:
- _id: ObjectId
- id: String (unique, required)
- password: String (hashed)
- accessToken, refreshToken: String
- createdAt, updatedAt: Date

#### 인덱스:
id (unique), createdAt

### CrowdHistory 컬렉션

#### 필드:
- _id: ObjectId
- areaCode, areaName, category: String
- peopleCount: Number
- congestionLevel: Number (1-5)
- rawData: Mixed
- timestamp: Date (TTL: 7일)

### 인덱스 전략

**01.** areaCode (단일 인덱스)

**02.** timestamp (TTL 인덱스 - 7일 후 자동 삭제)

**03.** {areaCode, timestamp} (복합 인덱스)

**04.** {category, peopleCount, timestamp} (복합 인덱스)

---

## Redis 캐시 구조

### 인파 데이터 캐시
- **Key:** crowd:{areaCode}
- **TTL:** 600초 (10분)
- **Value:** areaCode, areaInfo, data(서울시 API), fetchedAt

### 주차장 데이터 캐시
- **Key:** parking:{district}
- **TTL:** 600초 (10분)
- **Value:** parkingId, name, address, available, coordinates 등

### 지하철 혼잡도 캐시
- **Key:** subway:{areaCode}
- **TTL:** 600초 (10분)
- **Value:** areaCode, areaInfo, subway(서울시 API), fetchedAt

### 캐싱 전략
- 외부 API 호출 최소화
- Lambda 실행 시간 단축
- 응답 속도 향상
- 비용 절감

---

## 프론트엔드 설계

### 기술 스택
- React 18, TypeScript
- Vite (빌드 도구)
- Tailwind CSS (스타일링)
- React Router v6 (라우팅)
- React Context API (상태 관리)
- Recharts (차트)
- Axios (HTTP 클라이언트)

### 반응형 디자인
- **Mobile:** < 640px
- **Tablet:** 640px ~ 1024px
- **Desktop:** > 1024px

### 컴포넌트 구조
- **pages/:** Home, CrowdMap, CrowdDetail, HistoryView, Subway, Parking, PopularPlaces
- **components/:** Navbar (재사용 컴포넌트)
- **api/:** client, services, types
- **contexts/:** FavoriteContext

### 페이지 라우팅
- **/:** Home (대시보드)
- **/crowd:** CrowdMap (인파 지도)
- **/crowd/:areaCode:** CrowdDetail
- **/history/:areaCode:** HistoryView
- **/subway:** Subway
- **/parking:** Parking
- **/popular:** PopularPlaces

---

## S3 + CloudFront 배포

### 로컬 빌드
npm run build → dist/

### S3 업로드
aws s3 sync dist/ s3://crowdsense-web/

### CloudFront 무효화
캐시 갱신

### 모바일 최적화
- 터치 친화적 UI
- 하단 네비게이션 바
- 스와이프 제스처 지원
- PWA 설치 가능

### PC 최적화
- 사이드바 네비게이션
- 키보드 단축키
- 마우스 호버 효과
- 넓은 화면 활용

**레이어 구조:**  
Presentation Layer (Pages, Components) → Business Logic Layer (Contexts, Hooks) → Data Access Layer (API Services, Client)

---

## 보안 설계

### 인증/인가
- JWT 기반 인증
- 비밀번호 해싱 (bcrypt)
- Refresh Token Rotation
- CORS 설정

### 데이터 보안
- 입력 데이터 검증
- SQL Injection 방지 (MongoDB)
- XSS 방지 (React 자동 이스케이프)
- Rate Limiting

### API 보안
- HTTPS 사용 (프로덕션)
- API Key 관리 (환경 변수)
- 에러 메시지 노출 최소화

### IAM 및 Secrets
- Lambda 실행 역할: 최소 권한 원칙
- API Gateway 권한: 필요한 리소스만 접근
- Parameter Store 사용
- 환경 변수에 민감 정보 직접 저장 금지

---

## 성능 최적화 전략

### Lambda 최적화
- **콜드 스타트 최소화:** 프로비저닝된 동시성, Lambda Layer 활용, 의존성 최소화
- **메모리 설정:** 함수별 최적 메모리
- **타임아웃 설정**
- **함수 분리:** 단일 책임 원칙

### 데이터베이스 최적화
- **인덱스 최적화:** 단일, 복합, TTL 인덱스
- **쿼리 최적화**
- **ElastiCache 적극 활용:** 10분 TTL

### 프론트엔드 최적화
- 코드 스플리팅
- Lazy loading
- 이미지 최적화
- 번들 크기 최적화

### CloudWatch 모니터링
- Lambda 로그 자동 수집
- **메트릭:** 실행 시간, 에러율, 호출 횟수
- **알람:** 에러율 임계값 초과 시 알림

---

## 마이그레이션 계획

### 현재 구조 (Express 서버)
Express.js 기반 모놀리식 서버, MongoDB + Redis (로컬/클라우드), React 프론트엔드 (Vite)

### Phase 1: Lambda 함수 개발
- Express 라우트를 Lambda 함수로 변환
- 각 API 엔드포인트를 독립 Lambda 함수로 분리
- 공통 로직을 shared 레이어로 추출
- Lambda 함수별 테스트 코드 작성

### Phase 2: API Gateway 구성
- API Gateway에 RESTful 엔드포인트 등록
- 각 엔드포인트를 Lambda 함수와 연결
- CORS, Rate Limiting 설정
- API 스테이지 구성 (dev, staging, prod)

### Phase 3: 데이터베이스 마이그레이션
- **MongoDB → MongoDB Atlas:** 기존 데이터 마이그레이션, 연결 문자열 변경
- **Redis → ElastiCache (Redis 엔진):** 캐시 구조 유지, 연결 정보 변경

### Phase 4: 프론트엔드 배포
- S3 버킷 생성 및 정적 웹사이트 호스팅 설정
- CloudFront 배포 구성
- API 엔드포인트를 API Gateway URL로 변경
- 환경 변수 업데이트

