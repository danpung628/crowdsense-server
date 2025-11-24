# Eraser AI 다이어그램 코드

이 폴더에는 PPT 발표 자료에 사용된 Eraser AI 다이어그램 코드가 저장되어 있습니다.

## 파일 목록

### 1. `aws-serverless-architecture.erlang`
**AWS 서버리스 아키텍처 흐름도**

- 클라이언트 레이어 (React Web App, PWA)
- CDN 레이어 (CloudFront, S3)
- API 레이어 (API Gateway)
- Lambda 함수 레이어 (6개 마이크로서비스)
- 데이터 레이어 (MongoDB Atlas, Redis/ElastiCache)
- 외부 API 레이어 (서울시 공공데이터 API)

전체 시스템의 데이터 흐름을 보여주는 다이어그램입니다.

### 2. `microservices-architecture.erlang`
**마이크로서비스 아키텍처**

- API Gateway를 중심으로 한 단일 진입점
- 6개 Lambda 마이크로서비스
- 데이터 레이어 연결 관계

마이크로서비스 간의 구조와 연결을 보여주는 다이어그램입니다.

### 3. `lambda-function-structure.erlang`
**Lambda 함수 내부 구조**

- Shared Code 구조 (utils, models, config)
- 각 서비스 폴더 구조 (handler.js, service.js, controller.js)
- 의존성 관계

Lambda 함수의 내부 코드 구조와 의존성을 보여주는 다이어그램입니다.

## 사용 방법

1. [Eraser AI](https://eraser.io) 접속
2. 각 `.erlang` 파일의 내용을 복사
3. Eraser AI에 붙여넣기
4. 다이어그램 자동 생성

## 참고

- 모든 다이어그램은 Eraser AI 형식으로 작성되었습니다
- `.erlang` 확장자는 Eraser AI 코드 형식을 나타냅니다
- 다이어그램을 수정하려면 각 파일을 편집한 후 Eraser AI에 다시 붙여넣으세요

