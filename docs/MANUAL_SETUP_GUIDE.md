# 🛠️ AWS 서버리스 구현 가이드

> 이 프로젝트를 AWS 서버리스로 구현하기 위한 4가지 핵심 영역

---

## 1. S3 + CloudFront (프론트엔드 배포)

### 개요
React 빌드 결과물을 S3에 업로드하고, CloudFront로 HTTPS + CDN 제공

### AWS 콘솔에서 설정

#### 1.1 S3 버킷 생성
1. S3 → 버킷 만들기
2. 버킷 이름: `crowdsense-web-{고유값}` (전역 고유해야 함)
3. 리전: `ap-northeast-2` (서울)
4. **"모든 퍼블릭 액세스 차단" 해제**
5. 버킷 생성

#### 1.2 정적 웹사이트 호스팅 활성화
1. 버킷 → 속성 → 정적 웹사이트 호스팅
2. 활성화
3. 인덱스 문서: `index.html`
4. 오류 문서: `index.html` (SPA 라우팅용)

#### 1.3 버킷 정책 설정
버킷 → 권한 → 버킷 정책에 추가:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::버킷이름/*"
    }
  ]
}
```

#### 1.4 CloudFront 배포 생성
1. CloudFront → 배포 생성
2. 원본 도메인: S3 버킷 선택
3. 기본 루트 객체: `index.html`
4. 뷰어 프로토콜 정책: `Redirect HTTP to HTTPS`
5. 배포 생성

#### 1.5 CloudFront 오류 페이지 설정 (SPA용)
1. 배포 → 오류 페이지 → 사용자 정의 오류 응답 생성
2. 추가할 설정:
   - HTTP 오류 코드: `403` → 응답 페이지: `/index.html`, 응답 코드: `200`
   - HTTP 오류 코드: `404` → 응답 페이지: `/index.html`, 응답 코드: `200`

### 배포 방법
```bash
cd client
npm run build
aws s3 sync dist/ s3://버킷이름/ --delete
aws cloudfront create-invalidation --distribution-id 배포ID --paths "/*"
```

### 프론트엔드 환경 변수
`client/.env.production` 파일:
```env
VITE_API_BASE_URL=https://{api-id}.execute-api.ap-northeast-2.amazonaws.com/prod/api
```

---

## 2. API Gateway + Lambda (백엔드 API)

### 개요
Express 서버의 각 라우트를 독립적인 Lambda 함수로 변환하고, API Gateway로 연결

### Lambda 함수 목록 (19개)
    
| 서비스 | 함수명 | HTTP 메서드 | 엔드포인트 |
|--------|--------|-------------|------------|
| Auth | auth-register | POST | /api/auth/register |
| Auth | auth-login | POST | /api/auth/login |
| Auth | auth-logout | POST | /api/auth/logout |
| Auth | auth-refresh | POST | /api/auth/refresh |
| Auth | auth-me | GET | /api/auth/me |
| Crowd | crowd-list | GET | /api/crowds |
| Crowd | crowd-detail | GET | /api/crowds/{areaCode} |
| Crowd | crowd-history | GET | /api/crowds/{areaCode}/history |
| Subway | subway-list | GET | /api/subway |
| Subway | subway-detail | GET | /api/subway/{areaCode} |
| Parking | parking-list | GET | /api/parking |
| Parking | parking-nearby | GET | /api/parking/nearby |
| Parking | parking-district | GET | /api/parking/{district} |
| Ranking | ranking-popular | GET | /api/rankings/popular |
| Area | area-list | GET | /api/areas |
| Area | area-categories | GET | /api/areas/categories |
| Area | area-search | GET | /api/areas/search |
| Area | area-category | GET | /api/areas/category/{category} |
| Area | area-detail | GET | /api/areas/{areaCode} |

### AWS 콘솔에서 설정

#### 2.1 Lambda 함수 생성
1. Lambda → 함수 생성
2. 함수 이름: `crowdsense-{서비스}-{기능}` (예: `crowdsense-crowd-list`)
3. 런타임: `Node.js 20.x`
4. 아키텍처: `x86_64`
5. 실행 역할: 새 역할 생성 (기본 Lambda 권한)

#### 2.2 Lambda 함수 코드 구조
각 함수의 `index.js`:
```javascript
// 기존 Express 서비스 로직 import
const crowdService = require('./services/crowdService');

exports.handler = async (event) => {
  try {
    // pathParameters, queryStringParameters에서 파라미터 추출
    const { areaCode } = event.pathParameters || {};
    
    // 기존 서비스 로직 호출
    const result = await crowdService.getCrowdData(areaCode);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify({ success: true, data: result })
    };
  } catch (error) {
    return {
      statusCode: error.statusCode || 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
```

#### 2.3 Lambda Layer 생성 (공통 코드)
1. Lambda → 레이어 → 레이어 생성
2. 공통 코드를 zip으로 묶어 업로드:
   - `utils/` (areaMapping, jwtUtils, errorHandler 등)
   - `services/` (crowdService, parkingService 등)
   - `models/` (User, CrowdHistory)
   - `node_modules/` (mongoose, redis, axios, bcryptjs, jsonwebtoken)

#### 2.4 Lambda 환경 변수 설정
각 함수 → 구성 → 환경 변수:
```
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...elasticache...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
SEOUL_API_KEY=...
SEOUL_SUBWAY_API_KEY=...
SEOUL_PARKING_API_KEY=...
```

#### 2.5 API Gateway 생성
1. API Gateway → REST API 생성
2. API 이름: `crowdsense-api`
3. 엔드포인트 유형: `리전`

#### 2.6 API Gateway 리소스/메서드 생성
각 엔드포인트마다:
1. 리소스 생성 (예: `/api/crowds/{areaCode}`)
2. 메서드 생성 (GET, POST 등)
3. 통합 유형: Lambda 함수
4. Lambda 함수 선택
5. CORS 활성화

#### 2.7 API Gateway 배포
1. 작업 → API 배포
2. 스테이지: `prod`
3. 배포 후 URL 확인: `https://{api-id}.execute-api.ap-northeast-2.amazonaws.com/prod`

---

## 3. ElastiCache (Redis 캐시)

### 개요
현재 로컬 Redis를 AWS ElastiCache Redis로 교체

### AWS 콘솔에서 설정

#### 3.1 ElastiCache 클러스터 생성
1. ElastiCache → Redis OSS 캐시 → 캐시 생성
2. 클러스터 모드: 비활성화 (단일 노드)
3. 이름: `crowdsense-redis`
4. 노드 유형: `cache.t3.micro` (프리티어)
5. 복제본 수: 0 (개발용)

#### 3.2 보안 그룹 설정
1. VPC 보안 그룹 생성/수정
2. 인바운드 규칙: TCP 6379, 소스: Lambda 보안 그룹

#### 3.3 Lambda VPC 설정
ElastiCache는 VPC 내부에서만 접근 가능하므로:
1. Lambda 함수 → 구성 → VPC
2. ElastiCache와 같은 VPC 선택
3. 프라이빗 서브넷 선택
4. 보안 그룹 선택

#### 3.4 연결 정보
```
엔드포인트: crowdsense-redis.xxxxxx.apn2.cache.amazonaws.com
포트: 6379
```

Lambda 환경 변수:
```
REDIS_URL=redis://crowdsense-redis.xxxxxx.apn2.cache.amazonaws.com:6379
```

### 코드 변경
`redisClient.js`는 그대로 사용 가능, `REDIS_URL`만 변경

### 캐시 키 구조 (기존과 동일)
| 키 패턴 | TTL | 용도 |
|---------|-----|------|
| `crowd:{areaCode}` | 10분 | 인파 데이터 |
| `parking:{district}` | 10분 | 주차장 데이터 |
| `subway:{areaCode}` | 10분 | 지하철 데이터 |

---

## 4. MongoDB Atlas (데이터베이스)

### 개요
로컬/EC2 MongoDB를 MongoDB Atlas (클라우드)로 이전

### MongoDB Atlas 설정

#### 4.1 Atlas 계정 및 클러스터 생성
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 가입
2. 새 프로젝트 생성: `crowdsense`
3. 클러스터 생성:
   - 티어: M0 (무료)
   - 클라우드: AWS
   - 리전: `ap-northeast-2` (서울)

#### 4.2 데이터베이스 사용자 생성
1. Database Access → Add New Database User
2. 인증 방식: Password
3. 사용자명/비밀번호 설정
4. 권한: Read and write to any database

#### 4.3 네트워크 액세스 설정
1. Network Access → Add IP Address
2. **Lambda용**: `0.0.0.0/0` (모든 IP 허용) 또는 VPC Peering 설정

#### 4.4 연결 문자열 확인
1. Clusters → Connect → Connect your application
2. 연결 문자열 복사:
```
mongodb+srv://<YOUR_USERNAME>:<YOUR_PASSWORD>@<YOUR_CLUSTER>.mongodb.net/crowdsense?retryWrites=true&w=majority
```

### Lambda 환경 변수
```
MONGODB_URI=mongodb+srv://<YOUR_USERNAME>:<YOUR_PASSWORD>@<YOUR_CLUSTER>.mongodb.net/crowdsense?retryWrites=true&w=majority
```

### 컬렉션 구조

#### Users 컬렉션
```javascript
{
  _id: ObjectId,
  id: String,           // 사용자 ID (unique)
  password: String,     // bcrypt 해시
  accessToken: String,
  refreshToken: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### CrowdHistory 컬렉션
```javascript
{
  _id: ObjectId,
  areaCode: String,      // 지역 코드
  areaName: String,      // 지역명
  category: String,      // 카테고리
  peopleCount: Number,   // 인구 수
  congestionLevel: Number, // 혼잡도 (1-5)
  timestamp: Date,       // 기록 시간
  ttl: Number           // TTL (30일 후 자동 삭제)
}
```

### 인덱스 생성
Atlas UI 또는 MongoDB Compass에서:
```javascript
// Users
db.users.createIndex({ id: 1 }, { unique: true })

// CrowdHistory
db.crowdhistory.createIndex({ areaCode: 1, timestamp: -1 })
db.crowdhistory.createIndex({ timestamp: 1 }, { expireAfterSeconds: 2592000 }) // 30일 TTL
```

---

## 📋 구현 순서 권장

1. **MongoDB Atlas** 먼저 설정 (DB가 있어야 테스트 가능)
2. **ElastiCache** 설정 (캐시)
3. **Lambda 함수** 개발 및 배포 (하나씩 테스트)
4. **API Gateway** 연결
5. **S3 + CloudFront** 프론트엔드 배포
6. 프론트엔드 `VITE_API_BASE_URL`을 API Gateway URL로 변경

---

## 🔑 필요한 값 정리

| 항목 | 어디서 얻나 | 어디에 설정 |
|------|------------|------------|
| MongoDB 연결 문자열 | Atlas → Connect | Lambda 환경 변수 |
| Redis 엔드포인트 | ElastiCache 콘솔 | Lambda 환경 변수 |
| 서울 API 키 | data.seoul.go.kr | Lambda 환경 변수 |
| JWT Secret | 직접 생성 | Lambda 환경 변수 |
| API Gateway URL | 배포 후 확인 | 프론트엔드 .env.production |
| CloudFront URL | 배포 후 확인 | 브라우저 접속용 |
