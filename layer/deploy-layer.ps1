# Lambda Layer 배포 스크립트
# 리전을 .aws-region 파일에서 자동으로 읽어옵니다
#
# ⚠️ 중요: Lambda Layer 구조
# ============================
# 원본 코드는 이미 nodejs/shared/ 구조로 되어 있습니다.
# Lambda 함수에서 require('/opt/nodejs/shared/services/crowdService')로 import하므로
# Layer 내부 구조는 다음과 같아야 합니다:
#   nodejs/
#     shared/
#       services/
#       utils/
#       models/
#       ...
# 배포 스크립트는 nodejs/ 폴더를 그대로 ZIP으로 압축합니다.
# ============================

$ErrorActionPreference = "Stop"

# 프로젝트 루트로 이동
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptPath)
Set-Location $projectRoot

# 리전 읽기
$regionFile = Join-Path $projectRoot ".aws-region"
if (-not (Test-Path $regionFile)) {
    Write-Host "❌ .aws-region 파일이 없습니다. 프로젝트 루트에 .aws-region 파일을 생성하세요." -ForegroundColor Red
    Write-Host "예: echo 'ap-southeast-2' > .aws-region" -ForegroundColor Yellow
    exit 1
}

$region = (Get-Content $regionFile -Raw).Trim()
Write-Host "📍 사용 리전: $region" -ForegroundColor Cyan

# 현재 AWS CLI 기본 리전 확인
$currentRegion = aws configure get region 2>$null
if ($currentRegion -and $currentRegion -ne $region) {
    Write-Host "⚠️  경고: AWS CLI 기본 리전($currentRegion)과 프로젝트 리전($region)이 다릅니다." -ForegroundColor Yellow
    Write-Host "   --region $region 옵션을 사용합니다." -ForegroundColor Yellow
}

# layer 폴더로 이동
$layerPath = Join-Path $projectRoot "layer"
Set-Location $layerPath

Write-Host "`n📦 Lambda Layer 패키징 중..." -ForegroundColor Cyan

# ⚠️ 중요: nodejs/shared/ 구조 확인
# 원본 코드는 이미 nodejs/shared/ 구조로 되어 있습니다.
if (-not (Test-Path "nodejs\shared")) {
    Write-Host "  ❌ nodejs/shared 폴더가 없습니다!" -ForegroundColor Red
    Write-Host "     원본 코드는 nodejs/shared/ 구조로 되어 있어야 합니다." -ForegroundColor Yellow
    exit 1
}

Write-Host "  ✓ nodejs/shared 구조 확인 완료" -ForegroundColor Green

# areacode.csv 파일 확인 및 복사 (필요한 경우)
$areacodePath = Join-Path $projectRoot "server\areacode.csv"
if (Test-Path $areacodePath) {
    if (-not (Test-Path "nodejs\shared\areacode.csv")) {
        Copy-Item $areacodePath nodejs\shared\areacode.csv
        Write-Host "  ✓ areacode.csv 복사 완료" -ForegroundColor Green
    }
} elseif (Test-Path "nodejs\shared\areacode.csv") {
    Write-Host "  ✓ areacode.csv 이미 존재" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  areacode.csv 파일을 찾을 수 없습니다. server/areacode.csv를 확인하세요." -ForegroundColor Yellow
}

# 의존성 설치 (nodejs/shared/ 디렉토리에서 실행)
Set-Location nodejs\shared
if (-not (Test-Path package.json)) {
    Write-Host "  📝 package.json 생성 중..." -ForegroundColor Yellow
    @{
        dependencies = @{
            "@aws-sdk/client-dynamodb" = "^3.658.1"
            "@aws-sdk/lib-dynamodb" = "^3.658.1"
            "@aws-sdk/client-s3" = "^3.658.1"
            "bcryptjs" = "^2.4.3"
            "jsonwebtoken" = "^9.0.2"
            "redis" = "^4.7.0"
            "axios" = "^1.7.9"
        }
    } | ConvertTo-Json -Depth 10 | Out-File -FilePath package.json -Encoding utf8
}
Write-Host "  📦 npm install 실행 중..." -ForegroundColor Yellow
npm install --production --silent | Out-Null
Write-Host "  ✓ 의존성 설치 완료" -ForegroundColor Green

# ZIP 생성
Set-Location ..\..
$zipPath = Join-Path $projectRoot "layer\shared-layer.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}
Compress-Archive -Path nodejs -DestinationPath $zipPath -Force
Write-Host "  ✓ ZIP 파일 생성: shared-layer.zip" -ForegroundColor Green

# ZIP 크기 확인
$zipSize = (Get-Item $zipPath).Length / 1MB
Write-Host "  📊 ZIP 크기: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Cyan

# Lambda Layer 배포
Write-Host "`n🚀 Lambda Layer 배포 중..." -ForegroundColor Cyan
Write-Host "   리전: $region" -ForegroundColor Yellow
Write-Host "   Layer 이름: crowdsense-shared" -ForegroundColor Yellow

$description = "CrowdSense 공통 코드 Layer (구조: nodejs/shared/, 원본부터 올바른 구조로 관리)"

try {
    $result = aws lambda publish-layer-version `
        --layer-name crowdsense-shared `
        --description $description `
        --zip-file "fileb://$zipPath" `
        --compatible-runtimes nodejs20.x nodejs18.x `
        --region $region `
        --output json | ConvertFrom-Json

    $version = $result.Version
    $layerArn = $result.LayerVersionArn

    Write-Host "`n✅ 배포 완료!" -ForegroundColor Green
    Write-Host "   버전: $version" -ForegroundColor Cyan
    Write-Host "   ARN: $layerArn" -ForegroundColor Cyan

    # ARN 파일 업데이트
    $arnFile = Join-Path $projectRoot "lambda-functions\layer-arn-southeast2.txt"
    if ($region -eq "ap-southeast-2") {
        $layerArn | Out-File -FilePath $arnFile -Encoding utf8 -NoNewline
        Write-Host "   ✓ layer-arn-southeast2.txt 업데이트 완료" -ForegroundColor Green
    }

    Write-Host "`n📝 다음 단계:" -ForegroundColor Yellow
    Write-Host "   Lambda 함수들의 Layer를 버전 $version 으로 업데이트하세요:" -ForegroundColor White
    Write-Host "   aws lambda update-function-configuration --function-name <함수명> --layers $layerArn --region $region" -ForegroundColor Gray

} catch {
    Write-Host "`n❌ 배포 실패: $_" -ForegroundColor Red
    exit 1
}
