# 브라우저 자동화 가이드

## ⚠️ 중요: 브라우저 활용 원칙

**사용자가 브라우저를 열어두었다면, 반드시 브라우저를 활용하여 작업을 수행해야 합니다.**

### 사용 가능한 브라우저 도구

다음 MCP 브라우저 확장 도구들을 사용할 수 있습니다:

- `browser_snapshot`: 현재 페이지의 접근성 스냅샷 캡처
- `browser_navigate`: URL로 이동
- `browser_click`: 요소 클릭
- `browser_type`: 텍스트 입력
- `browser_take_screenshot`: 스크린샷 촬영
- `browser_tabs`: 탭 관리 (목록, 전환, 생성, 닫기)
- `browser_console_messages`: 콘솔 메시지 확인
- `browser_network_requests`: 네트워크 요청 확인

### 언제 브라우저를 사용해야 하나?

#### ✅ 브라우저를 사용해야 하는 경우

1. **AWS 콘솔 확인**
   - Lambda 함수 상태 확인
   - Layer 버전 확인
   - CloudWatch 로그 확인
   - API Gateway 설정 확인
   - DynamoDB 테이블 확인
   - ElastiCache 상태 확인

2. **배포 상태 확인**
   - CloudFront 배포 상태
   - S3 파일 업로드 확인
   - Lambda 함수 배포 확인

3. **에러 디버깅**
   - CloudWatch 로그에서 에러 확인
   - Lambda 함수 실행 결과 확인
   - API Gateway 응답 확인

4. **설정 확인**
   - Lambda 함수 환경 변수
   - Layer 연결 상태
   - API Gateway 엔드포인트

#### ❌ 브라우저를 사용하지 않아도 되는 경우

- 로컬 파일 읽기/쓰기
- 터미널 명령 실행
- 코드 수정
- 로컬 테스트

### 브라우저 활용 워크플로우

#### 1. 브라우저 탭 확인

```javascript
// 먼저 열려 있는 탭 확인
browser_tabs({ action: "list" })
```

#### 2. AWS 콘솔로 이동

```javascript
// Lambda 콘솔로 이동
browser_navigate({ url: "https://ap-southeast-2.console.aws.amazon.com/lambda/home?region=ap-southeast-2#/functions" })

// 또는 특정 함수로 이동
browser_navigate({ url: "https://ap-southeast-2.console.aws.amazon.com/lambda/home?region=ap-southeast-2#/functions/crowd-list" })
```

#### 3. 페이지 스냅샷으로 정보 확인

```javascript
// 현재 페이지의 구조 확인
browser_snapshot()
```

#### 4. 필요한 요소 클릭/상호작용

```javascript
// 함수 이름 클릭
browser_click({ element: "crowd-list function", ref: "e413" })

// 검색 입력
browser_type({ element: "Search functions", ref: "e238", text: "crowd-list", submit: true })
```

### 예시: Lambda Layer 버전 확인

```javascript
// 1. Lambda 콘솔로 이동
browser_navigate({ url: "https://ap-southeast-2.console.aws.amazon.com/lambda/home?region=ap-southeast-2#/layers" })

// 2. 페이지 로드 대기
browser_wait_for({ time: 3 })

// 3. 스냅샷으로 Layer 목록 확인
browser_snapshot()

// 4. 특정 Layer 클릭
browser_click({ element: "crowdsense-shared layer", ref: "e1470" })
```

### 예시: CloudWatch 로그 확인

```javascript
// 1. Lambda 함수 페이지로 이동
browser_navigate({ url: "https://ap-southeast-2.console.aws.amazon.com/lambda/home?region=ap-southeast-2#/functions/crowd-list" })

// 2. Monitor 탭 클릭
browser_click({ element: "Monitor tab", ref: "e1056" })

// 3. View logs in CloudWatch 클릭
browser_click({ element: "View logs in CloudWatch", ref: "..." })
```

### 주의사항

1. **브라우저가 열려 있는지 먼저 확인**
   - `browser_tabs({ action: "list" })`로 확인
   - 열려 있지 않으면 사용자에게 알리지 말고, 가능한 다른 방법 사용

2. **페이지 로드 대기**
   - `browser_wait_for({ time: 2 })` 사용
   - 또는 `browser_wait_for({ text: "Expected text" })` 사용

3. **스냅샷으로 구조 파악**
   - 클릭하기 전에 먼저 `browser_snapshot()`으로 구조 확인
   - 올바른 ref 찾기

4. **에러 처리**
   - 브라우저 작업 실패 시, 사용자에게 직접 확인을 요청하지 말고
   - 다른 방법(터미널 명령 등)을 시도하거나
   - 브라우저 상태를 다시 확인

### 금지 사항

❌ **사용자에게 "브라우저에서 확인해주세요"라고 요청하지 마세요**
- 브라우저가 열려 있다면 직접 확인해야 합니다
- 브라우저 도구를 사용할 수 없다면 터미널 명령(AWS CLI)을 사용하세요

❌ **브라우저가 열려 있는데도 터미널 명령만 사용하지 마세요**
- 브라우저가 더 빠르고 직관적입니다
- 시각적 확인이 가능합니다

### 참고

- MCP 브라우저 확장 도구 문서 참조
- AWS 콘솔 URL 패턴:
  - Lambda: `https://{region}.console.aws.amazon.com/lambda/home?region={region}#/functions`
  - CloudWatch: `https://{region}.console.aws.amazon.com/cloudwatch/home?region={region}#logsV2:log-groups`
  - API Gateway: `https://{region}.console.aws.amazon.com/apigateway/home?region={region}#/apis`
