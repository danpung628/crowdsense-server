# E2E 테스트 가이드

이 디렉토리에는 Playwright를 사용한 End-to-End 테스트가 포함되어 있습니다.

## 설치

```bash
npm install
npx playwright install
```

## 테스트 실행

### 기본 실행 (headless 모드)
```bash
npm run test:e2e
```

### UI 모드로 실행 (테스트 실행 과정을 시각적으로 확인)
```bash
npm run test:e2e:ui
```

### 브라우저를 보면서 실행 (headed 모드)
```bash
npm run test:e2e:headed
```

### 특정 브라우저만 실행
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### 특정 테스트만 실행
```bash
npx playwright test auth.spec.ts
```

### 다른 URL로 테스트
```bash
TEST_URL=http://localhost:5173 npm run test:e2e
```

## 테스트 커버리지 (정일혁 분담 - Auth API Gateway)

현재 다음 기능들이 테스트됩니다:

### 회원가입
- ✅ 정상 회원가입 (전체 검증)
  - 페이지 로드 확인
  - 폼 입력 필드 확인
  - API 요청/응답 상세 확인 (상태 코드, 본문, 헤더)
  - 토큰 저장 및 형식 검증
  - Navbar 상태 변경 확인
  - 자동 로그인 확인
- ✅ 빈 입력 필드 에러 처리
- ✅ 비밀번호 불일치 에러 처리
- ✅ 비밀번호 길이 부족 에러 처리
- ✅ 이미 존재하는 사용자 에러 처리 (API 상태 코드 확인)
- ✅ 특수문자 및 긴 문자열 입력 테스트
- ✅ 로딩 상태 확인
- ✅ 토큰 저장 확인
- ✅ Network 요청/응답 상세 확인
- ✅ Console 에러 확인

### 로그인
- ✅ 정상 로그인 (전체 검증)
  - 페이지 로드 확인
  - 폼 입력 필드 확인
  - API 요청/응답 상세 확인 (상태 코드, 본문, 헤더)
  - 토큰 저장 및 형식 검증
  - Navbar 상태 변경 확인
- ✅ 빈 입력 필드 에러 처리
- ✅ 잘못된 비밀번호 에러 처리 (API 상태 코드 401 확인)
- ✅ 존재하지 않는 사용자 에러 처리 (API 상태 코드 401 확인)
- ✅ 로딩 상태 확인
- ✅ 토큰 저장 확인
- ✅ Network 요청/응답 상세 확인
- ✅ Console 에러 확인

### Navbar 상태
- ✅ 로그인 전 UI 확인 (전체 UI 확인)
  - 로그인 버튼 표시
  - 회원가입 버튼 표시
  - 로그아웃 버튼 미표시
  - 사용자 ID 미표시
- ✅ 로그인 후 UI 확인 (전체 UI 확인)
  - 로그인 버튼 미표시
  - 회원가입 버튼 미표시
  - 로그아웃 버튼 표시
  - 사용자 ID 표시

### 로그아웃
- ✅ 로그아웃 버튼 작동 확인 (전체 검증)
  - API 요청/응답 확인
  - 토큰 제거 확인
  - Navbar 상태 변경 확인
  - 사용자 ID 제거 확인
- ✅ Network 요청 확인 (상태 코드, 응답 본문)

### 토큰 관리
- ✅ localStorage 토큰 저장 확인
- ✅ 토큰 형식 검증 (JWT 형식)
- ✅ 페이지 새로고침 후 토큰 유지 확인
- ✅ 사용자 정보 유지 확인

### 페이지 네비게이션
- ✅ 회원가입 페이지에서 로그인 페이지로 이동
- ✅ 로그인 페이지에서 회원가입 페이지로 이동

### Network 탭 검증
- ✅ API 요청 URL 확인
- ✅ API 요청 메서드 확인 (POST, GET)
- ✅ API 요청 본문 확인
- ✅ API 응답 상태 코드 확인 (200, 201, 400, 401, 409)
- ✅ API 응답 본문 확인
- ✅ API 요청 헤더 확인 (Content-Type 등)

### Console 탭 검증
- ✅ 에러 로그 수집
- ✅ 인증 관련 에러 확인
- ✅ 토큰 관련 에러 확인

## 테스트 리포트

테스트 실행 후 HTML 리포트가 자동으로 생성됩니다:
```bash
npx playwright show-report
```

## 디버깅

### 테스트 디버깅 모드
```bash
npx playwright test --debug
```

### 특정 테스트만 디버깅
```bash
npx playwright test auth.spec.ts --debug
```

### Playwright Inspector
```bash
PWDEBUG=1 npm run test:e2e
```

## CI/CD 통합

GitHub Actions 등에서 사용하려면:

```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
  env:
    TEST_URL: ${{ secrets.TEST_URL }}
```
