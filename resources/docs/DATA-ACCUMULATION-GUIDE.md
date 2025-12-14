# 데이터 누적 가이드

## 📊 데이터 누적 방법

### 자동 데이터 누적

**`/api/crowds` API가 호출될 때마다 자동으로 DynamoDB에 히스토리가 저장됩니다.**

#### 작동 방식

1. **API 호출 시점**
   - 사용자가 인파 페이지(`/crowd`)를 방문
   - 프론트엔드에서 `/api/crowds` API 호출
   - `crowd-list` Lambda 함수 실행

2. **데이터 수집 및 저장**
   - Lambda 함수가 서울시 공공데이터 API에서 실시간 데이터 조회
   - 각 지역별로 `fetchAndCacheOne(areaCode, true)` 호출
   - `saveHistory=true` 플래그로 DynamoDB 히스토리 저장 활성화
   - `CrowdHistoryDynamo.create()`로 데이터 저장

3. **저장되는 데이터**
   ```javascript
   {
     areaCode: "POI001",
     timestamp: 1702569600000,  // 현재 시간 (밀리초)
     areaName: "지역명",
     category: "카테고리",
     peopleCount: 12345,         // 인구수
     congestionLevel: 2,         // 혼잡도 (1-4)
     rawData: {...},             // 원본 API 응답
     ttl: 1705161600             // 30일 후 자동 삭제
   }
   ```

### 수동 데이터 수집 (배치 작업)

현재는 API 호출 시에만 데이터가 수집됩니다. 주기적인 데이터 수집이 필요하다면:

#### 옵션 1: EventBridge + Lambda (권장)

1. **EventBridge 규칙 생성**
   - 10분마다 실행되는 규칙 생성
   - `crowd-list` Lambda 함수 트리거

2. **Lambda 함수 수정**
   - EventBridge 이벤트인 경우 모든 지역 데이터 수집
   - API Gateway 요청인 경우 기존 로직 유지

#### 옵션 2: 수동 API 호출

```bash
# 모든 지역 데이터 수집을 위한 API 호출
curl -X GET "https://{api-gateway-url}/api/crowds" \
  -H "Authorization: Bearer {token}"
```

### 데이터 확인

#### DynamoDB에서 확인

```bash
# 특정 지역의 최근 히스토리 조회
aws dynamodb query \
  --table-name CrowdHistory \
  --key-condition-expression "areaCode = :code" \
  --expression-attribute-values '{":code":{"S":"POI001"}}' \
  --scan-index-forward false \
  --limit 10 \
  --region ap-southeast-2
```

#### 랭킹 API로 확인

```bash
# 인기 장소 랭킹 조회 (DynamoDB 데이터 기반)
curl -X GET "https://{api-gateway-url}/api/rankings/popular?hours=24" \
  -H "Authorization: Bearer {token}"
```

### 데이터 누적 시간

- **최소 데이터**: 1회 API 호출로 120개 지역 데이터 저장
- **랭킹 생성**: 최소 1시간 이상의 데이터 필요 (권장: 24시간)
- **TTL**: 30일 후 자동 삭제

### 빠른 데이터 수집 방법

1. **인파 페이지 방문**
   - `/crowd` 페이지를 여러 번 방문
   - 각 방문마다 최신 데이터가 DynamoDB에 저장됨

2. **API 직접 호출**
   ```bash
   # 10분마다 수동 호출 (총 6회 = 1시간 데이터)
   for i in {1..6}; do
     curl -X GET "https://{api-gateway-url}/api/crowds" \
       -H "Authorization: Bearer {token}"
     sleep 600  # 10분 대기
   done
   ```

3. **EventBridge 설정** (자동화)
   - AWS 콘솔에서 EventBridge 규칙 생성
   - `crowd-list` Lambda 함수를 10분마다 트리거

### 현재 상태 확인

```bash
# DynamoDB 테이블 아이템 수 확인
aws dynamodb scan \
  --table-name CrowdHistory \
  --select COUNT \
  --region ap-southeast-2
```

## 📝 참고

- 데이터는 **API 호출 시에만** 수집됩니다
- 랭킹을 보려면 **최소 1시간 이상의 데이터**가 필요합니다
- 데이터는 **30일 후 자동 삭제**됩니다 (TTL)
