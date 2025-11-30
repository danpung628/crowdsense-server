# 주차장 API 응답 구조

## 개요

주차장 API는 서울시 오픈 API에서 실시간 데이터를 가져오고, `parkingCoordinates.json`에서 좌표 정보를 매핑합니다.

## 데이터 소스

- **실시간 정보**: 서울시 오픈 API (`GetParkingInfo`)
  - 주차장명, 주소, 총 주차면, 현재 주차 차량수
  - 요금 정보, 운영시간 등
- **좌표 정보**: `parkingCoordinates.json`
  - 위도(lat), 경도(lng)만 저장
  - 주차장 코드(PKLT_CD)로 매핑

## API 응답 예시

### GET /api/parking

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "parkingId": "PKLT001",
        "code": "PKLT001",
        "name": "강남역 공영주차장",
        "district": "강남구",
        "address": "서울시 강남구 역삼동 123-45",
        "type": "공영",
        "operationType": "위탁",
        "tel": "02-1234-5678",
        "total": 100,
        "current": 55,
        "available": 45,
        "isAvailable": true,
        "isPaidParking": true,
        "rates": {
          "basic": {
            "fee": 1000,
            "time": 30
          },
          "additional": {
            "fee": 500,
            "time": 10
          },
          "dayMax": 10000
        },
        "operatingHours": {
          "weekday": "0800-2200",
          "weekend": "0800-2200",
          "holiday": "0800-2200"
        },
        "nightFree": false,
        "coordinates": {
          "latitude": 37.5172,
          "longitude": 127.0473
        },
        "lastUpdated": "2025-10-28T10:30:00Z",
        "updatedAt": "2025-10-28T10:35:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 500,
      "totalPages": 10
    }
  },
  "_links": {
    "self": { "href": "/api/parking?page=1&limit=50" },
    "first": { "href": "/api/parking?page=1&limit=50" },
    "last": { "href": "/api/parking?page=10&limit=50" },
    "next": { "href": "/api/parking?page=2&limit=50" }
  }
}
```

## 필드 설명

### 기본 정보
- `parkingId`: 주차장 고유 ID (PKLT_CD)
- `code`: 주차장 코드
- `name`: 주차장명 (PKLT_NM)
- `district`: 자치구
- `address`: 주소 (ADDR)
- `type`: 주차장 종류 (PRK_TYPE_NM)
- `operationType`: 운영구분 (OPER_SE_NM)
- `tel`: 전화번호 (TELNO)

### 주차 현황
- `total`: 총 주차면 (TPKCT)
- `current`: 현재 주차 차량수 (NOW_PRK_VHCL_CNT)
- `available`: 주차 가능 대수 (계산: total - current)
- `isAvailable`: 주차 가능 여부 (available > 0)

### 요금 정보
- `isPaidParking`: 유무료 구분 (PAY_YN === 'Y')
- `rates.basic.fee`: 기본 주차 요금 (BSC_PRK_CRG)
- `rates.basic.time`: 기본 주차 시간(분) (BSC_PRK_HR)
- `rates.additional.fee`: 추가 단위 요금 (ADD_PRK_CRG)
- `rates.additional.time`: 추가 단위 시간(분) (ADD_PRK_HR)
- `rates.dayMax`: 일 최대 요금 (DAY_MAX_CRG)

### 운영 정보
- `operatingHours.weekday`: 평일 운영시간 (WD_OPER_BGNG_TM ~ WD_OPER_END_TM)
- `operatingHours.weekend`: 주말 운영시간 (WE_OPER_BGNG_TM ~ WE_OPER_END_TM)
- `operatingHours.holiday`: 공휴일 운영시간 (LHLDY_OPER_BGNG_TM ~ LHLDY_OPER_END_TM)
- `nightFree`: 야간무료개방 여부 (NGHT_PAY_YN === 'Y')

### 위치 정보
- `coordinates.latitude`: 위도 (parkingCoordinates.json)
- `coordinates.longitude`: 경도 (parkingCoordinates.json)

### 업데이트 정보
- `lastUpdated`: 주차 현황 업데이트 시간 (NOW_PRK_VHCL_UPDT_TM)
- `updatedAt`: API 응답 생성 시간

## 서울시 오픈 API 필드 매핑

| 서울시 API 필드 | 응답 필드 | 설명 |
|----------------|---------|------|
| PKLT_CD | parkingId, code | 주차장 코드 |
| PKLT_NM | name | 주차장명 |
| ADDR | address | 주소 |
| PRK_TYPE_NM | type | 주차장 종류명 |
| OPER_SE_NM | operationType | 운영구분명 |
| TELNO | tel | 전화번호 |
| TPKCT | total | 총 주차면 |
| NOW_PRK_VHCL_CNT | current | 현재 주차 차량수 |
| PAY_YN | isPaidParking | 유무료 구분 |
| NGHT_PAY_YN | nightFree | 야간무료개방 여부 |
| BSC_PRK_CRG | rates.basic.fee | 기본 주차 요금 |
| BSC_PRK_HR | rates.basic.time | 기본 주차 시간 |
| ADD_PRK_CRG | rates.additional.fee | 추가 단위 요금 |
| ADD_PRK_HR | rates.additional.time | 추가 단위 시간 |
| DAY_MAX_CRG | rates.dayMax | 일 최대 요금 |
| WD_OPER_BGNG_TM | operatingHours.weekday | 평일 시작시각 |
| WD_OPER_END_TM | operatingHours.weekday | 평일 종료시각 |
| NOW_PRK_VHCL_UPDT_TM | lastUpdated | 현황 업데이트 시간 |

## parkingCoordinates.json 구조

```json
{
  "P-강남구-0": {
    "name": "강남구 주차장 1",
    "address": "강남구 일원동 716-2",
    "district": "강남구",
    "lat": 37.5172,
    "lng": 127.0473
  }
}
```

**역할**: 
- 서울시 API에는 좌표 정보가 없으므로 별도로 관리
- 주차장 코드(parkingId)로 매핑하여 좌표 정보 제공
- `name`, `address`, `district`는 참고용 (실제 응답에서는 API 데이터 사용)

