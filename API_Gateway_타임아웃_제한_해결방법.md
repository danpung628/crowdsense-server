# API Gateway 타임아웃 제한 해결 방법

> 작성일: 2025-12-14

## 🔍 문제 확인

### 발견된 제한사항

**API Gateway Integration 타임아웃 최대값: 29초 (29000ms)**

- 첫 번째 이미지에서 확인: "Timeout should be between 50 ms and 29000 ms"
- 이것이 우리가 30초 이상으로 늘릴 수 없다는 것을 의미

### 두 번째 이미지(CloudFront)는 관련 없음

- 두 번째 이미지는 **CloudFront Function associations** 화면
- Lambda@Edge 함수를 연결하는 설정
- **타임아웃 설정과는 무관함**

## 💡 해결 방법

### 방법 1: AWS Quota Increase 요청 (권장)

**2024년 6월부터 API Gateway Integration 타임아웃을 29초 이상으로 늘릴 수 있습니다.**

**절차**:

1. **Service Quotas 콘솔 접속**
   - AWS Console → Service Quotas
   - 또는 직접 링크: https://console.aws.amazon.com/servicequotas/home

2. **API Gateway 쿼터 찾기**
   - "AWS services" 선택
   - "Amazon API Gateway" 검색
   - **"Maximum integration timeout in milliseconds"** 쿼터 찾기

3. **Quota Increase 요청**
   - "Request increase at account level" 클릭
   - 원하는 타임아웃 값 입력 (예: 60000ms = 60초)
   - 요청 제출

4. **API Gateway Integration 타임아웃 업데이트**
   - API Gateway Console → 해당 API 선택
   - Method 선택 → Integration Request → Edit
   - Integration timeout을 새로운 값으로 설정 (예: 60초)
   - Save changes
   - API 재배포

**참고**: 
- Quota Increase 요청은 AWS 승인이 필요할 수 있음
- 타임아웃 증가 시 account-level throttle quota limit이 감소할 수 있음

### 방법 2: Lambda 함수 성능 최적화 (대안)

**29초 제한 내에서 해결**:

- Lambda 함수 실행 시간을 더 줄이기
- 현재: 약 2.25초
- 목표: 더 빠르게 (캐싱, 최적화 등)

**장점**:
- Quota Increase 요청 불필요
- 즉시 적용 가능

**단점**:
- Lambda 함수 코드 수정 필요
- 성능 최적화 작업 필요

## 🎯 권장 사항

### 서성덕님께 전달할 내용

**옵션 1 (권장)**: AWS Quota Increase 요청
```
서성덕님, API Gateway Integration 타임아웃이 최대 29초로 제한되어 있습니다.

해결 방법:
1. Service Quotas 콘솔에서 "Maximum integration timeout in milliseconds" 쿼터 증가 요청
2. 원하는 값 입력 (예: 60000ms = 60초)
3. 승인 후 API Gateway Integration 타임아웃 업데이트

참고: 2024년 6월부터 29초 이상 설정 가능하도록 변경되었습니다.
```

**옵션 2**: Lambda 함수 성능 최적화
```
서성덕님, API Gateway Integration 타임아웃이 최대 29초로 제한되어 있습니다.

대안:
- Lambda 함수 실행 시간을 더 줄이기 (현재 약 2.25초)
- 캐싱 최적화, 쿼리 최적화 등

김휘성님께 Lambda 함수 성능 최적화 요청 필요할 수 있습니다.
```

## 📊 현재 상황

| 항목 | 현재 값 | 제한 | 상태 |
|------|---------|------|------|
| API Gateway Integration 타임아웃 | 29초 | **최대 29초** | ❌ 제한됨 |
| Lambda 함수 타임아웃 | 28초 | - | ✅ 완료 |
| 실제 응답 시간 | 약 2.25초 | - | ✅ 정상 |
| 프론트엔드 타임아웃 | 15초 | - | ✅ 완료 |

## 💡 결론

**두 번째 이미지(CloudFront)는 관련 없습니다.**

**문제는 첫 번째 이미지(API Gateway)의 29초 제한입니다.**

**해결 방법**:
1. **AWS Quota Increase 요청** (29초 이상 설정 가능하도록)
2. 또는 **Lambda 함수 성능 최적화** (29초 제한 내에서 해결)
