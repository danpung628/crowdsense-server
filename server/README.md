# CrowdSense Server

클라우드웹서비스 CrowdSense 서버 - 서울시 인파 밀집도 및 주차 정보 REST API

## 📋 목차

- [기능 소개](#기능-소개)
- [기술 스택](#기술-스택)
- [설치 및 실행](#설치-및-실행)
- [AWS S3 설정](#aws-s3-설정)
- [환경 변수](#환경-변수)
- [API 문서](#api-문서)
- [프로젝트 구조](#프로젝트-구조)

## 🚀 기능 소개

### 핵심 기능
- **실시간 인구 밀집도 조회**: 서울시 주요 지역의 실시간 인파 정보
- **지하철 혼잡도 정보**: 서울 지하철역별 혼잡도 데이터
- **주차장 정보**: 서울시 공영주차장 실시간 주차 가능 대수
- **지역 정보**: POI 기반 지역 정보 및 카테고리 조회
- **인기 장소 랭킹**: 인구 밀집도 기반 인기 장소 순위

### 고급 기능
- **HATEOAS**: REST API Level 3 - Hypermedia 링크 제공
- **페이지네이션**: 대용량 데이터 효율적 조회
- **필터링 & 정렬**: 다양한 조건으로 데이터 검색
- **캐시 최적화**: Redis 캐싱 및 HTTP Cache-Control 헤더
- **S3 통합**: 정적 데이터 S3 관리 및 자동 백업
- **Swagger 문서**: 인터랙티브 API 문서

## 🛠 기술 스택

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (히스토리 데이터)
- **Cache**: Redis
- **Cloud**: AWS S3 (데이터 스토리지 및 백업)
- **Documentation**: Swagger/OpenAPI
- **External APIs**: 서울 열린데이터 광장 API

## 📦 설치 및 실행

### 1. 저장소 클론

```bash
git clone https://github.com/danpung628/crowdsense-server.git
cd crowdsense-server/server
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.example`을 복사하여 `.env` 파일을 생성하고 필요한 값을 설정합니다.

```bash
cp env.example .env
```

### 4. 서버 실행

**개발 모드 (nodemon)**
```bash
npm run dev
```

**프로덕션 모드**
```bash
npm start
```

서버가 시작되면 `http://localhost:3000`에서 접속 가능합니다.

## ☁️ AWS S3 설정

### S3 버킷 생성

1. AWS Console에서 S3 서비스로 이동
2. 버킷 생성 (예: `crowdsense-data`)
3. 리전 선택 (예: `ap-northeast-2` - 서울)
4. 버킷 정책 설정 (필요시)

### S3 버킷 구조

```
crowdsense-data/
├── static-data/              # 정적 데이터
│   ├── parkingCoordinates.json
│   └── areacode.csv
└── backups/                  # MongoDB 백업
    └── crowd-history/
        ├── 2025-10-27.json
        └── 2025-10-28.json
```

### IAM 사용자 및 권한 설정

1. **IAM 사용자 생성**
   - AWS Console → IAM → Users → Add User
   - Access Type: Programmatic access 선택
   - Access Key ID 및 Secret Access Key 저장

2. **필요한 권한 (Permissions)**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::crowdsense-data",
        "arn:aws:s3:::crowdsense-data/*"
      ]
    }
  ]
}
```

### S3 기능 활성화

`.env` 파일에서 S3 관련 설정:

```bash
# AWS S3 Configuration
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
S3_BUCKET_NAME=crowdsense-data

# S3 Feature Flags
USE_S3=true                     # S3에서 정적 데이터 로드
ENABLE_S3_BACKUP=true           # MongoDB 자동 백업 활성화
```

### S3 백업 API

- `GET /api/backups` - 백업 목록 조회
- `POST /api/backups/trigger` - 수동 백업 실행
- `GET /api/backups/status` - 백업 상태 확인

## 🔧 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `PORT` | 서버 포트 | 3000 |
| `MONGODB_URI` | MongoDB 연결 URI | mongodb://localhost:27017/crowdsense |
| `REDIS_URL` | Redis 연결 URL | redis://127.0.0.1:6379 |
| `JWT_SECRET` | JWT 서명 키 | - |
| `JWT_REFRESH_SECRET` | JWT 리프레시 토큰 키 | - |
| `DEV_FLAG` | 개발 모드 (1=인증 불필요) | 1 |
| `SEOUL_API_KEY` | 서울 열린데이터 API 키 | - |
| `AWS_REGION` | AWS 리전 | ap-northeast-2 |
| `AWS_ACCESS_KEY_ID` | AWS Access Key | - |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Key | - |
| `S3_BUCKET_NAME` | S3 버킷 이름 | crowdsense-data |
| `USE_S3` | S3 사용 여부 | false |
| `ENABLE_S3_BACKUP` | S3 백업 활성화 | false |

## 📚 API 문서

서버 실행 후 Swagger UI에서 인터랙티브 API 문서를 확인할 수 있습니다.

```
http://localhost:3000/api-docs
```

### 주요 엔드포인트

- **인증**: `/api/auth`
- **인구 밀집도**: `/api/crowds`
- **지하철 혼잡도**: `/api/subway`
- **주차장 정보**: `/api/parking`
- **지역 정보**: `/api/areas`
- **인기 장소**: `/api/rankings`
- **S3 백업**: `/api/backups`

## 📁 프로젝트 구조

```
server/
├── src/
│   ├── config/           # 설정 파일
│   │   └── swagger.js    # Swagger 설정
│   ├── controllers/      # 컨트롤러 (요청 처리)
│   ├── models/           # MongoDB 모델
│   ├── routes/           # 라우트 정의
│   ├── services/         # 비즈니스 로직
│   │   ├── crowdService.js
│   │   ├── subwayService.js
│   │   ├── parkingService.js
│   │   └── s3BackupService.js  # S3 백업 서비스
│   ├── middlewares/      # 미들웨어
│   ├── utils/            # 유틸리티
│   │   ├── s3Client.js   # S3 클라이언트
│   │   └── redisClient.js
│   └── data/             # 데이터 파일
│       ├── parkingCoordinates.json
│       └── parkingCoordinatesLoader.js  # S3 통합
├── scripts/              # 스크립트
├── server.js             # 서버 엔트리 포인트
├── package.json
└── env.example           # 환경 변수 예제
```

## 🎓 학교 프로젝트 활용

### EC2 + S3 가산점 획득 방법

이 프로젝트는 **EC2에서 실행**하고 **S3로 데이터를 관리**하도록 설계되었습니다.

1. **EC2 인스턴스 설정**
   - Ubuntu 또는 Amazon Linux 선택
   - Node.js 및 MongoDB, Redis 설치
   - 보안 그룹에서 포트 3000 오픈

2. **S3 데이터 관리**
   - 정적 데이터를 S3에서 로드 (`USE_S3=true`)
   - MongoDB 히스토리를 S3에 자동 백업 (`ENABLE_S3_BACKUP=true`)

3. **확장성 증명**
   - 여러 EC2 인스턴스가 같은 S3 버킷을 공유
   - 로컬 파일 대신 클라우드 스토리지 활용

## 📝 라이선스

ISC

## 👥 기여자

- 개발팀: CrowdSense Team

## 📞 문의

프로젝트 관련 문의사항은 GitHub Issues를 이용해주세요.
