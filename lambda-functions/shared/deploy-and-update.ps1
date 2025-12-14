# Lambda Layer 배포 및 Lambda 함수 업데이트 스크립트

$ErrorActionPreference = "Stop"

# 프로젝트 루트로 이동
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptPath)
Set-Location $projectRoot

# 리전 읽기
$regionFile = Join-Path $projectRoot ".aws-region"
if (-not (Test-Path $regionFile)) {
    Write-Host "❌ .aws-region 파일이 없습니다." -ForegroundColor Red
    exit 1
}

$region = (Get-Content $regionFile -Raw).Trim()
Write-Host "📍 사용 리전: $region" -ForegroundColor Cyan

# 1. Lambda Layer 배포
Write-Host "`n📦 Lambda Layer 배포 중..." -ForegroundColor Cyan
& "$projectRoot\lambda-functions\shared\deploy-layer.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Layer 배포 실패" -ForegroundColor Red
    exit 1
}

# 2. 배포된 Layer 버전 가져오기
Write-Host "`n🔍 최신 Layer 버전 확인 중..." -ForegroundColor Cyan
$latestVersion = aws lambda list-layer-versions `
    --layer-name crowdsense-shared `
    --region $region `
    --query "LayerVersions[0].Version" `
    --output text

if (-not $latestVersion) {
    Write-Host "❌ Layer 버전을 가져올 수 없습니다." -ForegroundColor Red
    exit 1
}

$layerArn = "arn:aws:lambda:${region}:099733535568:layer:crowdsense-shared:${latestVersion}"
Write-Host "   최신 버전: $latestVersion" -ForegroundColor Green
Write-Host "   ARN: $layerArn" -ForegroundColor Cyan

# 3. crowd-list Lambda 함수 업데이트
Write-Host "`n🔄 Lambda 함수 업데이트 중..." -ForegroundColor Cyan
$functionsToUpdate = @("crowd-list")

foreach ($funcName in $functionsToUpdate) {
    Write-Host "   업데이트 중: $funcName" -ForegroundColor Yellow
    
    try {
        aws lambda update-function-configuration `
            --function-name $funcName `
            --layers $layerArn `
            --region $region `
            --output json | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✓ $funcName 업데이트 완료" -ForegroundColor Green
        } else {
            Write-Host "   ✗ $funcName 업데이트 실패" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ✗ $funcName 업데이트 실패: $_" -ForegroundColor Red
    }
}

Write-Host "`n✅ 완료!" -ForegroundColor Green
Write-Host "   Layer 버전: $latestVersion" -ForegroundColor Cyan
Write-Host "   업데이트된 함수: $($functionsToUpdate -join ', ')" -ForegroundColor Cyan
