# Lambda Layer 구조 가이드

## ⚠️ 중요: 반드시 읽어야 할 사항

### Lambda Layer 디렉토리 구조

Lambda Layer는 **반드시 `nodejs/shared/` 구조**로 패키징되어야 합니다.

```
nodejs/
  shared/
    services/
      crowdService.js
      ...
    utils/
      ...
    models/
      ...
    ...
```

### 왜 이 구조인가?

Lambda 함수에서 다음과 같이 import합니다:

```javascript
const crowdService = require('/opt/nodejs/shared/services/crowdService');
```

AWS Lambda는 Layer를 `/opt/` 경로에 마운트하므로:
- Layer 내부: `nodejs/shared/services/crowdService.js`
- Lambda에서 접근: `/opt/nodejs/shared/services/crowdService`

### ❌ 잘못된 구조 (절대 사용하지 마세요!)

```
nodejs/
  services/          # ❌ 잘못됨!
    crowdService.js
```

이 구조로 배포하면 Lambda에서 `Cannot find module '/opt/nodejs/shared/services/crowdService'` 에러가 발생합니다.

### ✅ 올바른 구조

```
nodejs/
  shared/            # ✅ 올바름!
    services/
      crowdService.js
```

### 배포 스크립트 확인

`lambda-functions/shared/deploy-layer.ps1` 스크립트는 이미 올바른 구조로 배포하도록 작성되어 있습니다:

```powershell
# nodejs/shared 폴더 구조 생성
mkdir nodejs\shared | Out-Null

# 파일 복사 (nodejs/shared/ 구조로)
Copy-Item -Recurse utils,services,models,middlewares,data nodejs\shared\ -ErrorAction SilentlyContinue

# 의존성 설치
Set-Location nodejs\shared
npm install --production --silent | Out-Null
```

### 배포 전 체크리스트

1. ✅ `nodejs/shared/` 폴더가 생성되는지 확인
2. ✅ 파일들이 `nodejs/shared/` 아래로 복사되는지 확인
3. ✅ `npm install`이 `nodejs/shared/` 디렉토리에서 실행되는지 확인
4. ✅ ZIP 파일 내부 구조가 `nodejs/shared/...`인지 확인

### 문제 발생 시

만약 `Cannot find module` 에러가 발생하면:

1. Layer 버전의 구조 확인:
   ```bash
   aws lambda get-layer-version --layer-name crowdsense-shared --version-number <버전> --region ap-southeast-2
   ```

2. 배포 스크립트의 구조 확인:
   - `deploy-layer.ps1` 파일의 41-50번 줄 확인
   - `nodejs\shared\` 구조로 복사되는지 확인

3. 새 버전으로 재배포:
   ```powershell
   .\lambda-functions\shared\deploy-and-update.ps1
   ```

## 참고

- AWS Lambda Layer 구조: https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html
- Node.js Layer 경로: `/opt/nodejs/` (자동 마운트)
