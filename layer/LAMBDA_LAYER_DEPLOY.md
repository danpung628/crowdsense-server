# Lambda Layer 배포 가이드

`layer` 폴더를 Lambda Layer로 배포하는 방법입니다.

## 📋 구조

```
layer/
  nodejs/
    shared/
├── utils/
│   ├── dynamoClient.js
│   ├── jwtUtils.js
│   ├── errorHandler.js
│   ├── responseHelper.js
│   ├── redisClient.js
│   ├── areaMapping.js
│   ├── districtCoordinates.js
│   └── s3Client.js
├── services/
│   ├── authService.js
│   ├── crowdService.js
│   ├── subwayService.js
│   ├── parkingService.js
│   ├── rankingService.js
│   └── areaService.js
├── models/
│   ├── UserDynamo.js
│   └── CrowdHistoryDynamo.js
├── middlewares/
│   └── authMiddleware.js
├── data/
│   ├── parkingCoordinates.json
│   └── parkingCoordinatesLoader.js
└── areacode.csv (루트에 포함)
```

## 🚀 배포 방법

### 1. ZIP 파일 생성

Lambda Layer는 특정 디렉토리 구조를 요구합니다:

```bash
# layer 폴더로 이동
cd layer

# nodejs 폴더 생성 (Lambda Layer 요구사항)
mkdir -p nodejs

# 모든 파일을 nodejs 폴더로 복사
cp -r utils services models middlewares data nodejs/
cp areacode.csv nodejs/ 2>/dev/null || echo "areacode.csv는 별도로 포함 필요"

# node_modules 설치 (필요한 패키지)
cd nodejs
npm install --production
cd ..

# ZIP 생성
zip -r ../shared-layer.zip nodejs/

# 또는 Windows PowerShell
Compress-Archive -Path nodejs -DestinationPath ../shared-layer.zip
```

### 2. AWS CLI로 Layer 배포

```bash
aws lambda publish-layer-version \
  --layer-name crowdsense-shared \
  --description "CrowdSense 공통 코드 Layer" \
  --zip-file fileb://shared-layer.zip \
  --compatible-runtimes nodejs20.x nodejs18.x
```

### 3. Lambda 함수에 Layer 연결

각 Lambda 함수에 Layer를 연결:

```bash
# 예: auth-register 함수에 Layer 연결
aws lambda update-function-configuration \
  --function-name auth-register \
  --layers arn:aws:lambda:ap-northeast-2:ACCOUNT_ID:layer:crowdsense-shared:VERSION
```

또는 AWS Console에서:
1. Lambda 함수 선택
2. Layers 섹션 클릭
3. "Add a layer" 클릭
4. "Custom layers" 선택
5. `crowdsense-shared` 선택
6. Version 선택
7. Add 클릭

## 📦 포함해야 할 패키지

`nodejs/node_modules`에 다음 패키지들이 포함되어야 합니다:

```json
{
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.658.1",
    "@aws-sdk/lib-dynamodb": "^3.658.1",
    "@aws-sdk/client-s3": "^3.658.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "redis": "^4.7.0",
    "axios": "^1.7.9"
  }
}
```

## 🔧 자동화 스크립트

배포를 자동화하는 스크립트:

```bash
#!/bin/bash
# deploy-layer.sh

cd server/lambda-functions/shared

# 기존 nodejs 폴더 삭제
rm -rf nodejs

# nodejs 폴더 생성
mkdir -p nodejs

# 파일 복사
cp -r utils services models middlewares data nodejs/
cp ../../areacode.csv nodejs/ 2>/dev/null || true

# 의존성 설치
cd nodejs
npm install --production
cd ..

# ZIP 생성
zip -r ../shared-layer.zip nodejs/

echo "✅ Layer ZIP 파일 생성 완료: shared-layer.zip"
echo "다음 명령어로 배포하세요:"
echo "aws lambda publish-layer-version --layer-name crowdsense-shared --zip-file fileb://shared-layer.zip --compatible-runtimes nodejs20.x"
```

## ⚠️ 주의사항

1. **파일 크기 제한**: Lambda Layer는 50MB (압축), 250MB (압축 해제) 제한이 있습니다.
2. **경로**: Layer의 파일은 `/opt/nodejs/` 경로에서 접근 가능합니다.
3. **의존성**: `node_modules`는 `nodejs/node_modules`에 있어야 합니다.
4. **areacode.csv**: 파일이 크면 S3에 저장하고 런타임에 다운로드하는 것을 고려하세요.

## 📝 환경 변수

각 Lambda 함수에 다음 환경 변수를 설정해야 합니다:

- `DYNAMODB_TABLE_NAME`: Users 테이블명
- `DYNAMODB_CROWD_HISTORY_TABLE_NAME`: CrowdHistory 테이블명 (선택)
- `AWS_REGION`: AWS 리전
- `REDIS_URL` 또는 `ELASTICACHE_ENDPOINT`: Redis 엔드포인트
- `JWT_SECRET`: JWT 시크릿 키
- `JWT_REFRESH_SECRET`: JWT Refresh 시크릿 키
- `SEOUL_API_KEY`: 서울시 API 키
- `SEOUL_POPULATION_API_URL`: 서울시 API URL
- `AWS_S3_BUCKET_NAME`: S3 버킷명 (선택)

