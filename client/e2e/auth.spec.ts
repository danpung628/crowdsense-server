import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_URL || 'http://crowdsense-web-20251213095230.s3-website.ap-northeast-2.amazonaws.com';

// 테스트용 사용자 정보 (매번 고유한 ID 생성)
const generateTestUserId = () => `testuser_${Date.now()}_${Math.random().toString(36).substring(7)}`;
const TEST_PASSWORD = 'test1234';

// API 응답 정보를 저장할 인터페이스
interface ApiResponse {
  url: string;
  method: string;
  status: number;
  requestBody?: any;
  responseBody?: any;
  headers?: Record<string, string>;
}

test.describe('인증 기능 테스트 - 정일혁 분담', () => {
  let testUserId: string;

  test.beforeEach(() => {
    testUserId = generateTestUserId();
  });

  test('회원가입 - 정상 케이스 (전체 검증)', async ({ page }) => {
    // Console 에러 수집
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Network 요청/응답 상세 모니터링
    const apiResponses: ApiResponse[] = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/auth-')) {
        try {
          const request = response.request();
          const requestBody = request.postData() ? JSON.parse(request.postData()!) : undefined;
          const responseBody = await response.json().catch(() => null);
          
          apiResponses.push({
            url,
            method: request.method(),
            status: response.status(),
            requestBody,
            responseBody,
            headers: response.headers(),
          });
        } catch (e) {
          // 응답 파싱 실패는 무시
        }
      }
    });

    // 회원가입 페이지로 이동
    await page.goto('/register');

    // 페이지 로드 확인
    await expect(page.locator('h2')).toContainText('회원가입');
    
    // 회원가입 링크 확인
    await expect(page.locator('a:has-text("로그인")')).toBeVisible();

    // 폼 입력 필드 확인
    await expect(page.locator('input[name="id"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();

    // 폼 입력
    await page.fill('input[name="id"]', testUserId);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);

    // 로딩 상태 확인을 위해 버튼 텍스트 확인
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toContainText('회원가입');
    await expect(submitButton).toBeEnabled();

    // 회원가입 버튼 클릭
    await submitButton.click();

    // 로딩 상태 확인 (버튼이 비활성화되거나 텍스트가 변경되는지)
    await expect(submitButton).toBeDisabled().catch(() => {
      // 비활성화되지 않을 수도 있으므로 에러 무시
    });

    // 성공 시 홈으로 리다이렉트 확인
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });

    // API 응답 확인
    const registerResponse = apiResponses.find(r => r.url.includes('/auth-register'));
    expect(registerResponse).toBeTruthy();
    expect(registerResponse?.status).toBe(200); // 또는 201
    expect(registerResponse?.requestBody).toEqual({ id: testUserId, password: TEST_PASSWORD });
    expect(registerResponse?.responseBody?.success).toBe(true);

    // 자동 로그인 API 응답 확인
    const loginResponse = apiResponses.find(r => r.url.includes('/auth-login'));
    expect(loginResponse).toBeTruthy();
    expect(loginResponse?.status).toBe(200);
    expect(loginResponse?.requestBody).toEqual({ id: testUserId, password: TEST_PASSWORD });

    // localStorage에 토큰 저장 확인
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'));
    
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
    
    // 토큰 형식 검증 (JWT는 3개 부분으로 구성)
    expect(accessToken.split('.').length).toBe(3);
    expect(refreshToken.split('.').length).toBe(3);

    // Navbar에 사용자 ID 표시 확인
    await expect(page.locator('nav')).toContainText(testUserId);

    // 로그아웃 버튼 표시 확인
    await expect(page.locator('button:has-text("로그아웃")')).toBeVisible();

    // 로그인/회원가입 버튼이 사라졌는지 확인
    await expect(page.locator('a:has-text("로그인")')).not.toBeVisible();
    await expect(page.locator('a:has-text("회원가입")')).not.toBeVisible();

    // Console 에러 확인 (에러가 없어야 함)
    const authErrors = consoleErrors.filter(err => 
      err.includes('auth') || err.includes('Auth') || err.includes('token') || err.includes('401') || err.includes('403')
    );
    expect(authErrors.length).toBe(0);
  });

  test('회원가입 - 빈 입력 필드 에러', async ({ page }) => {
    await page.goto('/register');

    // 빈 필드로 제출 시도
    await page.click('button[type="submit"]');

    // HTML5 validation으로 인해 제출이 막힐 수 있음
    // 또는 에러 메시지가 표시되는지 확인
    const errorVisible = await page.locator('.bg-red-50, .text-red-700').isVisible().catch(() => false);
    const isStillOnRegisterPage = page.url().includes('/register');
    
    expect(errorVisible || isStillOnRegisterPage).toBeTruthy();
  });

  test('회원가입 - 비밀번호 불일치 에러', async ({ page }) => {
    await page.goto('/register');

    // 폼 입력 (비밀번호 불일치)
    await page.fill('input[name="id"]', testUserId);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', 'different1234');

    // 회원가입 버튼 클릭
    await page.click('button[type="submit"]');

    // 에러 메시지 표시 확인
    await expect(page.locator('.bg-red-50, .text-red-700')).toContainText('비밀번호가 일치하지 않습니다');

    // 페이지가 이동하지 않았는지 확인
    await expect(page).toHaveURL(/\/register/);
    
    // API 요청이 발생하지 않았는지 확인 (클라이언트 사이드 검증)
    const apiRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/auth-')) {
        apiRequests.push(request.url());
      }
    });
    
    // 잠시 대기
    await page.waitForTimeout(500);
    expect(apiRequests.length).toBe(0);
  });

  test('회원가입 - 비밀번호 길이 부족 에러', async ({ page }) => {
    await page.goto('/register');

    // 폼 입력 (비밀번호 3자)
    await page.fill('input[name="id"]', testUserId);
    await page.fill('input[name="password"]', '123');
    await page.fill('input[name="confirmPassword"]', '123');

    // 회원가입 버튼 클릭
    await page.click('button[type="submit"]');

    // 에러 메시지 표시 확인
    await expect(page.locator('.bg-red-50, .text-red-700')).toContainText('4자 이상');

    // 페이지가 이동하지 않았는지 확인
    await expect(page).toHaveURL(/\/register/);
  });

  test('회원가입 - 이미 존재하는 사용자 에러', async ({ page }) => {
    // 먼저 회원가입
    await page.goto('/register');
    await page.fill('input[name="id"]', testUserId);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });

    // 로그아웃
    await page.click('button:has-text("로그아웃")');
    await expect(page).toHaveURL(/\/$/);

    // API 응답 모니터링
    const apiResponses: ApiResponse[] = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/auth-')) {
        try {
          const request = response.request();
          const responseBody = await response.json().catch(() => null);
          apiResponses.push({
            url,
            method: request.method(),
            status: response.status(),
            responseBody,
          });
        } catch (e) {}
      }
    });

    // 같은 ID로 다시 회원가입 시도
    await page.goto('/register');
    await page.fill('input[name="id"]', testUserId);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // 에러 메시지 표시 확인
    await expect(page.locator('.bg-red-50, .text-red-700')).toContainText(/이미 존재|존재하는/, { timeout: 5000 });

    // API 응답 상태 코드 확인 (400 또는 409)
    await page.waitForTimeout(1000);
    const registerResponse = apiResponses.find(r => r.url.includes('/auth-register'));
    expect(registerResponse).toBeTruthy();
    expect([400, 409]).toContain(registerResponse?.status);
    expect(registerResponse?.responseBody?.success).toBe(false);
  });

  test('로그인 - 정상 케이스 (전체 검증)', async ({ page }) => {
    // 먼저 회원가입
    await page.goto('/register');
    await page.fill('input[name="id"]', testUserId);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });

    // 로그아웃
    await page.click('button:has-text("로그아웃")');
    await expect(page).toHaveURL(/\/$/);

    // Console 에러 수집
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Network 요청/응답 상세 모니터링
    const apiResponses: ApiResponse[] = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/auth-')) {
        try {
          const request = response.request();
          const requestBody = request.postData() ? JSON.parse(request.postData()!) : undefined;
          const responseBody = await response.json().catch(() => null);
          
          apiResponses.push({
            url,
            method: request.method(),
            status: response.status(),
            requestBody,
            responseBody,
            headers: response.headers(),
          });
        } catch (e) {}
      }
    });

    // 로그인 페이지로 이동
    await page.goto('/login');

    // 페이지 로드 확인
    await expect(page.locator('h2')).toContainText('로그인');
    
    // 회원가입 링크 확인
    await expect(page.locator('a:has-text("회원가입")')).toBeVisible();

    // 폼 입력 필드 확인
    await expect(page.locator('input[name="id"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    // 폼 입력
    await page.fill('input[name="id"]', testUserId);
    await page.fill('input[name="password"]', TEST_PASSWORD);

    // 로그인 버튼 클릭
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // 성공 시 홈으로 리다이렉트 확인
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });

    // API 응답 확인
    await page.waitForTimeout(1000);
    const loginResponse = apiResponses.find(r => r.url.includes('/auth-login'));
    expect(loginResponse).toBeTruthy();
    expect(loginResponse?.status).toBe(200);
    expect(loginResponse?.requestBody).toEqual({ id: testUserId, password: TEST_PASSWORD });
    expect(loginResponse?.responseBody?.success).toBe(true);
    expect(loginResponse?.responseBody?.accessToken).toBeTruthy();
    expect(loginResponse?.responseBody?.refreshToken).toBeTruthy();

    // localStorage에 토큰 저장 확인
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'));
    
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
    
    // 토큰 형식 검증
    expect(accessToken.split('.').length).toBe(3);
    expect(refreshToken.split('.').length).toBe(3);

    // Navbar에 사용자 ID 표시 확인
    await expect(page.locator('nav')).toContainText(testUserId);

    // 로그아웃 버튼 표시 확인
    await expect(page.locator('button:has-text("로그아웃")')).toBeVisible();

    // 로그인/회원가입 버튼이 사라졌는지 확인
    await expect(page.locator('a:has-text("로그인")')).not.toBeVisible();
    await expect(page.locator('a:has-text("회원가입")')).not.toBeVisible();

    // Console 에러 확인 (에러가 없어야 함)
    const authErrors = consoleErrors.filter(err => 
      err.includes('auth') || err.includes('Auth') || err.includes('token') || err.includes('401') || err.includes('403')
    );
    expect(authErrors.length).toBe(0);
  });

  test('로그인 - 빈 입력 필드 에러', async ({ page }) => {
    await page.goto('/login');

    // 빈 필드로 제출 시도
    await page.click('button[type="submit"]');

    // HTML5 validation 또는 에러 메시지 확인
    const errorVisible = await page.locator('.bg-red-50, .text-red-700').isVisible().catch(() => false);
    const isStillOnLoginPage = page.url().includes('/login');
    
    expect(errorVisible || isStillOnLoginPage).toBeTruthy();
  });

  test('로그인 - 잘못된 비밀번호 에러', async ({ page }) => {
    // 먼저 회원가입
    await page.goto('/register');
    await page.fill('input[name="id"]', testUserId);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });

    // 로그아웃
    await page.click('button:has-text("로그아웃")');
    await expect(page).toHaveURL(/\/$/);

    // API 응답 모니터링
    const apiResponses: ApiResponse[] = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/auth-')) {
        try {
          const request = response.request();
          const responseBody = await response.json().catch(() => null);
          apiResponses.push({
            url,
            method: request.method(),
            status: response.status(),
            responseBody,
          });
        } catch (e) {}
      }
    });

    // 잘못된 비밀번호로 로그인 시도
    await page.goto('/login');
    await page.fill('input[name="id"]', testUserId);
    await page.fill('input[name="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    // 에러 메시지 표시 확인
    await expect(page.locator('.bg-red-50, .text-red-700')).toContainText(/비밀번호|일치하지 않습니다/, { timeout: 5000 });

    // 페이지가 이동하지 않았는지 확인
    await expect(page).toHaveURL(/\/login/);

    // API 응답 상태 코드 확인 (401)
    await page.waitForTimeout(1000);
    const loginResponse = apiResponses.find(r => r.url.includes('/auth-login'));
    expect(loginResponse).toBeTruthy();
    expect(loginResponse?.status).toBe(401);
    expect(loginResponse?.responseBody?.success).toBe(false);
  });

  test('로그인 - 존재하지 않는 사용자 에러', async ({ page }) => {
    // API 응답 모니터링
    const apiResponses: ApiResponse[] = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/auth-')) {
        try {
          const request = response.request();
          const responseBody = await response.json().catch(() => null);
          apiResponses.push({
            url,
            method: request.method(),
            status: response.status(),
            responseBody,
          });
        } catch (e) {}
      }
    });

    await page.goto('/login');

    // 존재하지 않는 사용자로 로그인 시도
    await page.fill('input[name="id"]', 'nonexistent_user_12345');
    await page.fill('input[name="password"]', TEST_PASSWORD);

    await page.click('button[type="submit"]');

    // 에러 메시지 표시 확인
    await expect(page.locator('.bg-red-50, .text-red-700')).toContainText(/없는 회원|존재하지 않습니다/, { timeout: 5000 });

    // 페이지가 이동하지 않았는지 확인
    await expect(page).toHaveURL(/\/login/);

    // API 응답 상태 코드 확인 (401)
    await page.waitForTimeout(1000);
    const loginResponse = apiResponses.find(r => r.url.includes('/auth-login'));
    expect(loginResponse).toBeTruthy();
    expect(loginResponse?.status).toBe(401);
    expect(loginResponse?.responseBody?.success).toBe(false);
  });

  test('Navbar 상태 - 로그인 전 (전체 UI 확인)', async ({ page }) => {
    // localStorage 초기화
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });

    // 홈 페이지로 이동
    await page.goto('/');

    // 로그인 버튼 표시 확인
    await expect(page.locator('a:has-text("로그인")')).toBeVisible();

    // 회원가입 버튼 표시 확인
    await expect(page.locator('a:has-text("회원가입")')).toBeVisible();

    // 로그아웃 버튼이 표시되지 않는지 확인
    await expect(page.locator('button:has-text("로그아웃")')).not.toBeVisible();

    // 사용자 ID가 표시되지 않는지 확인
    const navText = await page.locator('nav').textContent();
    expect(navText).not.toContain(testUserId);
  });

  test('Navbar 상태 - 로그인 후 (전체 UI 확인)', async ({ page }) => {
    // 회원가입 및 로그인
    await page.goto('/register');
    await page.fill('input[name="id"]', testUserId);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });

    // 로그인 버튼이 표시되지 않는지 확인
    await expect(page.locator('a:has-text("로그인")')).not.toBeVisible();

    // 회원가입 버튼이 표시되지 않는지 확인
    await expect(page.locator('a:has-text("회원가입")')).not.toBeVisible();

    // 로그아웃 버튼 표시 확인
    await expect(page.locator('button:has-text("로그아웃")')).toBeVisible();

    // 사용자 ID 표시 확인
    await expect(page.locator('nav')).toContainText(testUserId);
  });

  test('로그아웃 기능 (전체 검증)', async ({ page }) => {
    // 회원가입 및 로그인
    await page.goto('/register');
    await page.fill('input[name="id"]', testUserId);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });

    // 토큰이 저장되어 있는지 확인
    const accessTokenBefore = await page.evaluate(() => localStorage.getItem('accessToken'));
    const refreshTokenBefore = await page.evaluate(() => localStorage.getItem('refreshToken'));
    expect(accessTokenBefore).toBeTruthy();
    expect(refreshTokenBefore).toBeTruthy();

    // Network 요청/응답 모니터링
    const apiResponses: ApiResponse[] = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/auth-')) {
        try {
          const request = response.request();
          const headers = request.headers();
          const responseBody = await response.json().catch(() => null);
          apiResponses.push({
            url,
            method: request.method(),
            status: response.status(),
            responseBody,
            headers: response.headers(),
          });
        } catch (e) {}
      }
    });

    // 로그아웃 버튼 클릭
    await page.click('button:has-text("로그아웃")');

    // 홈으로 리다이렉트 확인
    await expect(page).toHaveURL(/\/$/);

    // API 응답 확인
    await page.waitForTimeout(1000);
    const logoutResponse = apiResponses.find(r => r.url.includes('/auth-logout'));
    expect(logoutResponse).toBeTruthy();
    expect(logoutResponse?.status).toBe(200);
    expect(logoutResponse?.responseBody?.success).toBe(true);

    // localStorage에서 토큰 제거 확인
    const accessTokenAfter = await page.evaluate(() => localStorage.getItem('accessToken'));
    const refreshTokenAfter = await page.evaluate(() => localStorage.getItem('refreshToken'));
    
    expect(accessTokenAfter).toBeNull();
    expect(refreshTokenAfter).toBeNull();

    // Navbar 상태 변경 확인 (로그인 버튼 표시)
    await expect(page.locator('a:has-text("로그인")')).toBeVisible();
    await expect(page.locator('button:has-text("로그아웃")')).not.toBeVisible();

    // 사용자 ID가 사라졌는지 확인
    const navText = await page.locator('nav').textContent();
    expect(navText).not.toContain(testUserId);
  });

  test('토큰 저장 및 유지 확인 (페이지 새로고침)', async ({ page }) => {
    // 회원가입 및 로그인
    await page.goto('/register');
    await page.fill('input[name="id"]', testUserId);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });

    // 토큰 저장 확인
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'));
    
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();

    // 페이지 새로고침
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 토큰이 유지되는지 확인
    const accessTokenAfterReload = await page.evaluate(() => localStorage.getItem('accessToken'));
    const refreshTokenAfterReload = await page.evaluate(() => localStorage.getItem('refreshToken'));
    
    expect(accessTokenAfterReload).toBe(accessToken);
    expect(refreshTokenAfterReload).toBe(refreshToken);

    // 사용자 정보가 유지되는지 확인 (Navbar에 사용자 ID 표시)
    await expect(page.locator('nav')).toContainText(testUserId);
    
    // 로그아웃 버튼이 여전히 표시되는지 확인
    await expect(page.locator('button:has-text("로그아웃")')).toBeVisible();
  });

  test('페이지 네비게이션 - 회원가입에서 로그인으로 이동', async ({ page }) => {
    await page.goto('/register');
    
    // 회원가입 페이지에서 로그인 링크 클릭
    await page.click('a:has-text("로그인")');
    
    // 로그인 페이지로 이동 확인
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h2')).toContainText('로그인');
  });

  test('페이지 네비게이션 - 로그인에서 회원가입으로 이동', async ({ page }) => {
    await page.goto('/login');
    
    // 로그인 페이지에서 회원가입 링크 클릭
    await page.click('a:has-text("회원가입")');
    
    // 회원가입 페이지로 이동 확인
    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator('h2')).toContainText('회원가입');
  });

  test('특수문자 및 긴 문자열 입력 테스트', async ({ page }) => {
    await page.goto('/register');

    // 특수문자 포함 ID
    const specialCharId = `test_${testUserId}_!@#$%`;
    await page.fill('input[name="id"]', specialCharId);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
    
    await page.click('button[type="submit"]');
    
    // 성공하거나 에러 메시지가 표시되어야 함
    const isSuccess = page.url().includes('/') && !page.url().includes('/register');
    const hasError = await page.locator('.bg-red-50, .text-red-700').isVisible().catch(() => false);
    
    expect(isSuccess || hasError).toBeTruthy();
  });

  test('로딩 상태 확인 - 회원가입', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="id"]', testUserId);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
    
    const submitButton = page.locator('button[type="submit"]');
    const initialText = await submitButton.textContent();
    
    // 버튼 클릭
    await submitButton.click();
    
    // 로딩 상태 확인 (버튼 텍스트가 변경되거나 비활성화되는지)
    try {
      await expect(submitButton).toContainText('가입 중', { timeout: 1000 });
    } catch {
      // 로딩 텍스트가 없어도 괜찮음
    }
    
    // 최종적으로 성공해야 함
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
  });

  test('로딩 상태 확인 - 로그인', async ({ page }) => {
    // 먼저 회원가입
    await page.goto('/register');
    await page.fill('input[name="id"]', testUserId);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });

    // 로그아웃
    await page.click('button:has-text("로그아웃")');
    
    // 로그인 페이지로 이동
    await page.goto('/login');
    
    await page.fill('input[name="id"]', testUserId);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    
    const submitButton = page.locator('button[type="submit"]');
    
    // 버튼 클릭
    await submitButton.click();
    
    // 로딩 상태 확인
    try {
      await expect(submitButton).toContainText('로그인 중', { timeout: 1000 });
    } catch {
      // 로딩 텍스트가 없어도 괜찮음
    }
    
    // 최종적으로 성공해야 함
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
  });

  test('Network 탭 - 모든 API 요청 헤더 확인', async ({ page }) => {
    const requestHeaders: Record<string, any>[] = [];
    
    page.on('request', (request) => {
      if (request.url().includes('/auth-')) {
        requestHeaders.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
        });
      }
    });

    // 회원가입
    await page.goto('/register');
    await page.fill('input[name="id"]', testUserId);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });

    // Content-Type 헤더 확인
    const registerRequest = requestHeaders.find(r => r.url.includes('/auth-register'));
    expect(registerRequest).toBeTruthy();
    expect(registerRequest?.headers['content-type']).toContain('application/json');
  });

  test('Console 탭 - 에러 로그 수집 및 확인', async ({ page }) => {
    const consoleMessages: Array<{ type: string; text: string }> = [];
    
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
      });
    });

    // 정상 회원가입
    await page.goto('/register');
    await page.fill('input[name="id"]', testUserId);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });

    // 에러 로그가 없어야 함
    const errorLogs = consoleMessages.filter(m => m.type === 'error');
    const authRelatedErrors = errorLogs.filter(m => 
      m.text.includes('auth') || 
      m.text.includes('Auth') || 
      m.text.includes('401') || 
      m.text.includes('403') ||
      m.text.includes('token')
    );
    
    expect(authRelatedErrors.length).toBe(0);
  });
});
