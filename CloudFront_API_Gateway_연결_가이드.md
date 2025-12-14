# CloudFront API Gateway 연결 가이드

> 작성일: 2025-12-14

## 📋 서성덕 형님 지시사항

1. **API Gateway 연결 확인**: "api gateway랑도 연결이 안돼있었더라고" → "일단 이건 해결했어"
2. **Cache Behavior 생성**: "create behavior 하고 origin and origin groups에서"
3. **API Gateway 선택**: "API gateway 선택지 하나인데 그거 선택하고 밑에 함수 연결하면될듯"
4. **Function Association 주의**: "function association은 건드리는 거 아니었어 일단 api gateway 연결만 함"

## 🔧 CloudFront Cache Behavior 설정 방법

### 1. Path Pattern 입력
- **필수**: `/api/*` 입력
- 현재 에러: "This field cannot be empty"
- 해결: Path pattern 필드에 `/api/*` 입력

### 2. Origin and Origin Groups 선택
- **선택**: "API Gateway" 옵션
- Domain: `cntfsdk0vc.execute-api.ap-southeast-2.amazonaws.com`
- S3 옵션은 선택하지 않음

### 3. 설정 항목
- **Path pattern**: `/api/*`
- **Target origin**: `API Gateway` (cntfsdk0vc.execute-api.ap-southeast-2.amazonaws.com)
- **Viewer protocol policy**: `Redirect HTTP to HTTPS` (또는 `HTTPS Only`)
- **Allowed HTTP methods**: `GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE`
- **Cache policy**: `CachingDisabled` (API는 캐싱하지 않음)
- **Origin request policy**: `AllViewer` (모든 헤더 전달)

### 4. Function Association
- **주의**: Function Association은 건드리지 않음
- Lambda@Edge 함수 연결은 필요 없음

## ✅ 완료 후 확인사항

1. **Behaviors 탭에서 확인**:
   - `/api/*` 패턴이 추가되었는지 확인
   - Target origin이 API Gateway인지 확인

2. **프론트엔드 확인**:
   - API Base URL이 `https://dz5uco59sqbhv.cloudfront.net`로 설정되어 있는지 확인
   - 빌드 및 배포 완료 확인

3. **테스트**:
   - 브라우저에서 `https://dz5uco59sqbhv.cloudfront.net/api/crowds` 접속
   - API 요청이 정상 작동하는지 확인

## 💡 참고

- CloudFront 설정 변경은 배포에 몇 분이 걸릴 수 있음
- 설정 변경 후 CloudFront 캐시 무효화 필요할 수 있음
- Function Association은 Lambda@Edge 함수 연결용이므로 이번 작업에서는 불필요

