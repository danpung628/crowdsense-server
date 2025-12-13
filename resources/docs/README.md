# CrowdSense 프로젝트 문서

이 폴더에는 CrowdSense 프로젝트의 모든 문서가 포함되어 있습니다.

## 📋 문서 목록

### 📌 과제 제출 관련 문서

#### 설계 문서
- **[DESIGN_DOCUMENT.md](./DESIGN_DOCUMENT.md)** - AWS 서버리스 마이그레이션 설계 계획 (메인 설계서)

#### 과제 정보
- **[과제_요구사항_정리.md](./과제_요구사항_정리.md)** - 클라우드 웹 서비스 과제 요구사항 정리
- **[diagrams-README.md](./diagrams-README.md)** - Eraser AI 다이어그램 설명 (설계서 작성 참고용)

---

### 📚 개발 참고용 문서

개발 참고용 문서는 [`reference/`](./reference/) 폴더에 있습니다.

- **API_GUIDE.md** - RESTful API 상세 가이드 (Express 서버용)
- **PARKING_API_RESPONSE.md** - 주차장 API 응답 구조 설명
- **EC2_DEPLOYMENT_GUIDE.md** - EC2 배포 가이드 (Express 서버용)
- **client-README.md** - 클라이언트 애플리케이션 정보

## 📁 프로젝트 구조

```
crowdsense-server/
├── docs/              # 📚 모든 문서 (이 폴더)
│   ├── DESIGN_DOCUMENT.md          # 과제 제출용 설계서
│   ├── 과제_요구사항_정리.md        # 과제 요구사항
│   ├── diagrams-README.md          # 다이어그램 설명
│   └── reference/                  # 개발 참고용 문서
├── server/            # 백엔드 서버 (Express)
├── client/            # 프론트엔드 (React)
└── diagrams/          # 아키텍처 다이어그램 코드
```

## 🚀 빠른 시작

프로젝트 실행 방법은 루트의 [README.md](../README.md)를 참고하세요.
