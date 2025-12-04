#!/bin/bash

# CrowdSense 프론트엔드 배포 스크립트
# S3 + CloudFront 배포

set -e

echo "🚀 CrowdSense 프론트엔드 배포 시작..."

# 환경 변수 확인
if [ -z "$AWS_S3_BUCKET" ]; then
  echo "❌ AWS_S3_BUCKET 환경 변수가 설정되지 않았습니다."
  exit 1
fi

if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  echo "⚠️  CLOUDFRONT_DISTRIBUTION_ID가 설정되지 않았습니다. CloudFront 무효화를 건너뜁니다."
fi

# 빌드
echo "📦 빌드 중..."
npm run build

# S3 업로드
echo "📤 S3에 업로드 중..."
aws s3 sync dist/ s3://$AWS_S3_BUCKET/ --delete --cache-control "public, max-age=31536000, immutable"

# CloudFront 무효화
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  echo "🔄 CloudFront 캐시 무효화 중..."
  INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)
  echo "✅ 무효화 ID: $INVALIDATION_ID"
fi

echo "✅ 배포 완료!"

