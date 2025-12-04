# CrowdSense 프론트엔드 배포 스크립트 (PowerShell)
# S3 + CloudFront 배포

$ErrorActionPreference = "Stop"

Write-Host "🚀 CrowdSense 프론트엔드 배포 시작..." -ForegroundColor Cyan

# 환경 변수 확인
if (-not $env:AWS_S3_BUCKET) {
    Write-Host "❌ AWS_S3_BUCKET 환경 변수가 설정되지 않았습니다." -ForegroundColor Red
    exit 1
}

# 빌드
Write-Host "📦 빌드 중..." -ForegroundColor Yellow
npm run build

# S3 업로드
Write-Host "📤 S3에 업로드 중..." -ForegroundColor Yellow
aws s3 sync dist/ "s3://$env:AWS_S3_BUCKET/" --delete --cache-control "public, max-age=31536000, immutable"

# CloudFront 무효화
if ($env:CLOUDFRONT_DISTRIBUTION_ID) {
    Write-Host "🔄 CloudFront 캐시 무효화 중..." -ForegroundColor Yellow
    $invalidationId = aws cloudfront create-invalidation `
        --distribution-id $env:CLOUDFRONT_DISTRIBUTION_ID `
        --paths "/*" `
        --query 'Invalidation.Id' `
        --output text
    Write-Host "✅ 무효화 ID: $invalidationId" -ForegroundColor Green
} else {
    Write-Host "⚠️  CLOUDFRONT_DISTRIBUTION_ID가 설정되지 않았습니다. CloudFront 무효화를 건너뜁니다." -ForegroundColor Yellow
}

Write-Host "✅ 배포 완료!" -ForegroundColor Green

