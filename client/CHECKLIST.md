# 작업 확인 체크리스트

## ✅ 1. 빌드 확인

```bash
cd client
npm run build
```

- [ ] 빌드가 에러 없이 완료되는가?
- [ ] `dist/` 폴더가 생성되는가?

---

## ✅ 2. 개발 서버 실행 확인

```bash
cd client
npm run dev
```

1. 브라우저에서 `http://localhost:5173` 접속
2. F12 → Console 탭에서 에러 확인

- [ ] 페이지가 로드되는가?
- [ ] 콘솔에 빨간색 에러가 없는가?

---

## ✅ 3. 환경 변수 확인

1. 브라우저 콘솔(F12 → Console)에서 확인
2. 페이지 로드 시 자동으로 API 요청 실행됨

- [ ] 콘솔에 "✅ API 응답 성공" 로그가 보이는가?

---

## ✅ 4. PWA 기능 확인

1. F12 → Application 탭 → Service Workers

- [ ] Status에 초록색 원 + "activated and is running"이 보이는가?

---

## ✅ 5. 반응형 디자인 확인

1. F12 → Ctrl+Shift+M (모바일 보기)

- [ ] 모바일 크기에서 레이아웃이 깨지지 않는가?

---

## ✅ 6. 라우팅 확인

각 주소로 직접 접속해서 페이지가 로드되는지 확인:

- [ ] `/` - 홈
- [ ] `/crowd` - 인파
- [ ] `/transit` - 교통
- [ ] `/parking` - 주차
- [ ] `/popular` - 인기장소

---

## ✅ 7. TypeScript 확인

```bash
cd client
npx tsc --noEmit
```

- [ ] 에러 없이 완료되는가?
