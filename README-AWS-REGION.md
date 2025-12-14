# AWS 리전 관리

이 프로젝트는 `.aws-region` 파일을 통해 AWS 리전을 중앙에서 관리합니다.

## 📍 리전 설정

프로젝트 루트에 `.aws-region` 파일이 있으며, 현재 리전은 다음과 같습니다:

```
ap-southeast-2
```

## 🔧 리전 변경 방법

리전을 변경하려면 `.aws-region` 파일을 수정하세요:

```powershell
# 리전 변경
echo "ap-northeast-2" > .aws-region

# 또는 직접 파일 편집
notepad .aws-region
```

## 📝 리전을 사용하는 스크립트

다음 스크립트들이 `.aws-region` 파일을 자동으로 읽어서 사용합니다:

1. **Lambda Layer 배포**: `lambda-functions/shared/deploy-layer.ps1`
   ```powershell
   .\lambda-functions\shared\deploy-layer.ps1
   ```

2. **Lambda 함수 다운로드**: `scripts/download-lambda-from-aws.ps1`
   ```powershell
   .\scripts\download-lambda-from-aws.ps1
   ```

3. **Lambda Layer 다운로드**: `scripts/download-lambda-layer.ps1`
   ```powershell
   .\scripts\download-lambda-layer.ps1
   ```

## ⚠️ 주의사항

- `.aws-region` 파일이 없으면 기본값으로 `ap-southeast-2`를 사용합니다.
- AWS CLI의 기본 리전(`aws configure get region`)과 다를 수 있습니다.
- 모든 스크립트는 `.aws-region` 파일의 리전을 우선적으로 사용하며, 필요시 `--region` 옵션을 명시합니다.

## 🔍 현재 리전 확인

```powershell
# .aws-region 파일 내용 확인
Get-Content .aws-region

# AWS CLI 기본 리전 확인
aws configure get region
```

## 📊 리전별 리소스

- **ap-southeast-2** (현재 사용 중)
  - Lambda Layer: `crowdsense-shared` (버전 15)
  - Lambda 함수들: 19개
  - DynamoDB 테이블들
  - ElastiCache 클러스터

- **ap-northeast-2** (사용 안 함)
  - Lambda Layer: `crowdsense-shared` (버전 2)
