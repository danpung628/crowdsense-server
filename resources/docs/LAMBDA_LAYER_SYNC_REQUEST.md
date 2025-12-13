# Lambda Layer 동기화 요청

## 요청 사항

로컬 개발 환경과 배포된 Lambda Layer를 동기화하기 위해 다음을 요청드립니다:

### 1. Lambda Layer 코드 다운로드

현재 AWS에 배포된 Lambda Layer (`shared` Layer, 버전 8)의 코드를 로컬 `lambda-functions/shared/` 폴더로 동기화해주세요.

**목적:**
- 로컬에서 실제 배포된 코드를 확인하고 테스트할 수 있도록
- 프론트엔드 개발 시 실제 에러 메시지 구조를 정확히 파악하기 위해

### 2. 동기화 방법

`scripts/download-lambda-layer.ps1` 스크립트를 실행하세요:

```powershell
.\scripts\download-lambda-layer.ps1
```

이 스크립트는 자동으로:
1. AWS에서 Lambda Layer (shared, 버전 8) 다운로드
2. `lambda-functions/shared/` 폴더로 복사
3. 임시 파일 정리

### 3. 현재 상황

- ✅ Lambda Layer 다운로드 완료 (임시 폴더)
- ✅ `lambda-functions/shared/` 폴더로 복사 완료
- ⚠️ Lambda 함수가 502 에러로 실행되지 않는 문제 발생 중

### 4. 추가 확인 사항

Lambda 함수가 502 에러를 반환하는 원인을 확인해주세요:
- Lambda Layer가 함수에 올바르게 연결되어 있는지
- Lambda 함수의 런타임 및 환경 변수 설정이 올바른지
- CloudWatch Logs에서 실제 에러 메시지 확인

### 5. 참고

- Lambda Layer ARN: `arn:aws:lambda:ap-southeast-2:099733535568:layer:shared:8`
- Lambda 함수: `auth-login`, `auth-register` 등
- 리전: `ap-southeast-2`

