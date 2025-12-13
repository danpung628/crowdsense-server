# 배포 가이드

CrowdSense 프론트엔드를 AWS S3 + CloudFront에 배포하는 방법입니다.

## 📋 사전 준비

### 1. AWS 계정 및 권한

다음 권한이 필요합니다:
- S3 버킷 생성 및 업로드 권한
- CloudFront 배포 생성 및 관리 권한
- IAM 사용자 또는 역할 설정

### 2. AWS CLI 설치 및 설정

```bash
# AWS CLI 설치 확인
aws --version

# AWS 자격 증명 설정
aws configure
```

다음 정보를 입력하세요:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (예: `ap-northeast-2`)
- Default output format (예: `json`)

## 🚀 배포 단계

### 1단계: S3 버킷 생성

```bash
# 버킷 이름 (전역적으로 고유해야 함)
BUCKET_NAME="crowdsense-web-$(date +%s)"

# 버킷 생성
aws s3 mb s3://$BUCKET_NAME --region ap-northeast-2

# 정적 웹사이트 호스팅 활성화
aws s3 website s3://$BUCKET_NAME \
  --index-document index.html \
  --error-document index.html
```

### 2단계: 버킷 정책 설정

```bash
# 버킷 정책 JSON 파일 생성
cat > bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

# 정책 적용
aws s3api put-bucket-policy \
  --bucket $BUCKET_NAME \
  --policy file://bucket-policy.json
```

### 3단계: CloudFront 배포 생성

```bash
# CloudFront 배포 생성
aws cloudfront create-distribution \
  --origin-domain-name $BUCKET_NAME.s3.ap-northeast-2.amazonaws.com \
  --default-root-object index.html
```

배포 ID를 기록해두세요.

### 4단계: 환경 변수 설정

```bash
# Windows PowerShell
$env:AWS_S3_BUCKET="your-bucket-name"
$env:CLOUDFRONT_DISTRIBUTION_ID="your-distribution-id"

# Linux/Mac
export AWS_S3_BUCKET="your-bucket-name"
export CLOUDFRONT_DISTRIBUTION_ID="your-distribution-id"
```

### 5단계: 배포 실행

**Windows:**
```powershell
.\deploy.ps1
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

## 🔧 수동 배포

스크립트를 사용하지 않는 경우:

### 1. 빌드

```bash
npm run build
```

### 2. S3 업로드

```bash
aws s3 sync dist/ s3://your-bucket-name/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable"
```

### 3. CloudFront 캐시 무효화

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## ⚙️ 환경 변수 설정

프로덕션 환경에서는 `.env.production` 파일을 사용합니다:

```env
VITE_API_BASE_URL=https://your-api-gateway-url.execute-api.ap-northeast-2.amazonaws.com/prod/api
```

빌드 시 자동으로 적용됩니다:

```bash
npm run build
```

## 🔍 배포 확인

### S3 웹사이트 엔드포인트 (현재 사용 가능)
- **URL**: `http://crowdsense-web-20251213095230.s3-website.ap-northeast-2.amazonaws.com`
- **접근**: HTTP만 지원 (HTTPS는 CloudFront 필요)
- **상태**: ✅ 배포 완료 및 접근 가능

### CloudFront 배포 (계정 검증 대기 중)
1. CloudFront 배포 완료 대기 (5-10분 소요)
2. CloudFront 도메인으로 접속 확인
3. 모든 페이지가 정상 작동하는지 확인
4. API 호출이 정상적으로 작동하는지 확인

## 🐛 문제 해결

### S3 업로드 실패

- AWS 자격 증명 확인: `aws sts get-caller-identity`
- 버킷 권한 확인
- 버킷 이름이 전역적으로 고유한지 확인

### CloudFront 캐시 문제

- 캐시 무효화 후 5-10분 대기
- 브라우저 캐시 삭제
- 시크릿 모드에서 테스트

### API 연결 오류

- `.env.production`의 API Gateway URL 확인
- CORS 설정 확인
- API Gateway 스테이지 확인

## 📝 참고사항

- CloudFront 배포는 처음 생성 시 15-20분 소요됩니다
- 배포 후 변경사항은 즉시 반영되지 않을 수 있습니다 (캐시 무효화 필요)
- 프로덕션 환경에서는 HTTPS를 사용하세요 (CloudFront 기본 제공)

