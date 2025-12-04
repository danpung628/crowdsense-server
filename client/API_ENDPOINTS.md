# API 엔드포인트 목록

프론트엔드에서 사용하는 모든 API 엔드포인트 목록입니다.

## 인파 데이터 API (`/api/crowds`)

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/crowds` | 전체 인파 데이터 조회 |
| GET | `/api/crowds/:areaCode` | 특정 지역 인파 데이터 조회 |
| GET | `/api/crowds/:areaCode/history` | 특정 지역의 히스토리 조회 |
| GET | `/api/crowds/:areaCode/stats` | 특정 지역의 통계 조회 |

## 지하철 혼잡도 API (`/api/subway`)

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/subway` | 전체 지하철 혼잡도 조회 |
| GET | `/api/subway/:stationId` | 특정 역 혼잡도 조회 |
| GET | `/api/subway?line={line}` | 노선별 조회 |

## 주차장 API (`/api/parking`)

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/parking` | 전체 주차장 조회 |
| GET | `/api/parking/:parkingCode` | 특정 주차장 조회 |
| GET | `/api/parking/nearby?lat={lat}&lng={lng}&radius={radius}` | 주변 주차장 검색 |
| GET | `/api/parking/district/:district` | 구별 주차장 조회 |
| GET | `/api/parking/search?q={query}` | 주차장 검색 |

## 지역 정보 API (`/api/areas`)

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/areas` | 전체 지역 조회 |
| GET | `/api/areas/:areaCode` | 특정 지역 조회 |
| GET | `/api/areas/categories` | 카테고리 목록 조회 |
| GET | `/api/areas/category/:category` | 카테고리별 조회 |
| GET | `/api/areas/search?q={query}` | 지역 검색 |

## 랭킹 API (`/api/rankings`)

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/rankings/popular?limit={limit}&hours={hours}` | 인기 장소 랭킹 |

## 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 개발 환경
VITE_API_BASE_URL=http://localhost:3000/api

# 프로덕션 환경 (.env.production)
VITE_API_BASE_URL=https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/api
```

## API Gateway 엔드포인트 형식

API Gateway의 엔드포인트는 다음과 같은 형식입니다:
```
https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/api
```

예시:
```
https://abc123xyz.execute-api.ap-northeast-2.amazonaws.com/prod/api
```

