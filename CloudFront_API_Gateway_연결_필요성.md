# CloudFront와 API Gateway 연결 필요성

> 작성일: 2025-12-14

## 🔍 현재 아키텍처

### 현재 구조
```
브라우저
  ├─ CloudFront (dz5uco59sqbhv.cloudfront.net)
  │   └─ S3 (정적 파일만)
  │
  └─ API Gateway (cntfsdk0vc.execute-api.ap-southeast-2.amazonaws.com)
      └─ Lambda 함수들
```

**현재 상태**:
- CloudFront: S3의 정적 파일만 제공 (프론트엔드)
- API 요청: 브라우저에서 직접 API Gateway로 요청
- CloudFront와 Lambda는 연결되어 있지 않음

## 🤔 CloudFront와 API Gateway 연결이 필요한가?

### 답변: **필수는 아니지만, 연결하면 좋은 점이 있습니다**

### 연결하지 않아도 되는 경우
- 현재처럼 브라우저에서 직접 API Gateway로 요청
- CORS 설정이 올바르게 되어 있으면 문제 없음
- 더 간단한 구조

### 연결하면 좋은 점

#### 1. CORS 문제 해결
- 같은 도메인에서 요청 (CloudFront 도메인 사용)
- CORS preflight 요청 불필요
- 단일 도메인 사용

#### 2. 캐싱 가능
- API 응답 캐싱 (선택적)
- 성능 향상

#### 3. 보안 강화
- 단일 엔드포인트
- API Gateway URL 노출 최소화

## 💡 현재 문제와의 관계

### 현재 문제
- 브라우저에서 API 요청이 즉시 실패
- OPTIONS 요청이 없음
- Service Worker가 API 요청을 가로챔

### CloudFront 연결이 도움이 될까?

**도움이 될 수 있음**:
- CORS 문제 해결 가능
- 같은 도메인에서 요청하므로 CORS preflight 불필요

**하지만**:
- Service Worker 문제는 해결되지 않음
- 다른 원인일 수도 있음

## 🎯 권장 사항

### 옵션 1: CloudFront에 API Gateway Origin 추가 (권장)

**구조**:
```
브라우저
  └─ CloudFront
      ├─ S3 (정적 파일)
      └─ API Gateway (API 요청)
          └─ Lambda 함수들
```

**장점**:
- CORS 문제 해결
- 단일 도메인 사용
- 캐싱 가능

**단점**:
- 설정이 복잡함
- CloudFront 설정 추가 필요

### 옵션 2: 현재 구조 유지 + 문제 해결

**현재 문제 해결**:
1. Service Worker가 API 요청을 가로채지 않도록 수정
2. API Gateway CORS 설정 확인
3. OPTIONS 요청이 정상 작동하는지 확인

**장점**:
- 더 간단한 구조
- 현재 문제만 해결하면 됨

**단점**:
- CORS 설정이 복잡할 수 있음

## 📋 CloudFront에 API Gateway Origin 추가 방법

### 1. CloudFront Distribution 수정

**Origin 추가**:
- Origin Domain: `cntfsdk0vc.execute-api.ap-southeast-2.amazonaws.com`
- Origin Path: `/prod`
- Origin Protocol: HTTPS

### 2. Cache Behavior 추가

**Path Pattern**: `/api/*`
- Target Origin: API Gateway Origin
- Allowed Methods: GET, POST, PUT, DELETE, OPTIONS, HEAD
- Cache Policy: CachingDisabled (API는 캐싱하지 않음)
- Origin Request Policy: AllViewer (모든 헤더 전달)

### 3. 프론트엔드 API Base URL 변경

**변경 전**:
```
VITE_API_BASE_URL=https://cntfsdk0vc.execute-api.ap-southeast-2.amazonaws.com/prod
```

**변경 후**:
```
VITE_API_BASE_URL=https://dz5uco59sqbhv.cloudfront.net
```

## 💡 결론

**CloudFront와 API Gateway 연결은 필수가 아닙니다.**

**하지만 연결하면**:
- CORS 문제 해결 가능
- 단일 도메인 사용
- 더 나은 보안

**현재 문제 해결 우선순위**:
1. Service Worker 문제 해결
2. API Gateway CORS 설정 확인
3. 필요시 CloudFront에 API Gateway Origin 추가

