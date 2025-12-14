# Lambda Layer 코드를 다운로드하여 lambda-functions/shared로 동기화

$ErrorActionPreference = "Continue"

# 리전 읽기 (.aws-region 파일에서)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
$regionFile = Join-Path $projectRoot ".aws-region"

if (Test-Path $regionFile) {
    $region = (Get-Content $regionFile -Raw).Trim()
    Write-Host "📍 리전: $region (.aws-region 파일에서 읽음)" -ForegroundColor Cyan
} else {
$region = "ap-southeast-2"
    Write-Host "⚠️  .aws-region 파일이 없어 기본 리전 사용: $region" -ForegroundColor Yellow
}

$layerName = "crowdsense-shared"
$layerVersion = 15  # 최신 버전 (필요시 수정)

Write-Host "Lambda Layer 다운로드 시작..." -ForegroundColor Cyan
Write-Host "Layer: $layerName (버전 $layerVersion)" -ForegroundColor Yellow
Write-Host "리전: $region" -ForegroundColor Yellow
Write-Host ""

try {
    # Layer 다운로드 URL 가져오기
    Write-Host "Layer 다운로드 URL 가져오는 중..." -ForegroundColor Yellow
    $layerUrl = aws lambda get-layer-version --layer-name $layerName --version-number $layerVersion --region $region --query "Content.Location" --output text 2>$null
    
    if ($LASTEXITCODE -ne 0 -or -not $layerUrl) {
        Write-Host "  실패: Layer 다운로드 URL 가져오기 실패" -ForegroundColor Red
        Write-Host "  Layer가 존재하는지 확인해주세요." -ForegroundColor Red
        exit 1
    }
    
    # 임시 파일 경로
    $tempZip = "$env:TEMP\shared-layer.zip"
    $tempDir = "$env:TEMP\shared-layer"
    
    # ZIP 다운로드
    Write-Host "Layer ZIP 파일 다운로드 중..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $layerUrl -OutFile $tempZip -ErrorAction Stop
    
    # ZIP 압축 해제
    Write-Host "압축 해제 중..." -ForegroundColor Yellow
    Expand-Archive -Path $tempZip -DestinationPath $tempDir -Force -ErrorAction Stop
    
    # lambda-functions/shared로 복사
    $source = Join-Path $tempDir "nodejs\shared"
    $dest = "lambda-functions\shared"
    
    if (-not (Test-Path $source)) {
        Write-Host "  실패: Layer 구조가 예상과 다릅니다." -ForegroundColor Red
        Write-Host "  확인된 경로: $tempDir" -ForegroundColor Yellow
        Get-ChildItem $tempDir -Recurse -Directory | Select-Object FullName | Out-String | Write-Host
        exit 1
    }
    
    Write-Host "lambda-functions/shared로 복사 중..." -ForegroundColor Yellow
    if (Test-Path $dest) {
        Remove-Item $dest -Recurse -Force
    }
    Copy-Item -Path $source -Destination $dest -Recurse -Force
    
    # 임시 파일 정리
    Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
    
    Write-Host ""
    Write-Host "✅ Lambda Layer 동기화 완료!" -ForegroundColor Green
    Write-Host "  대상 폴더: $dest" -ForegroundColor Cyan
    
    # 복사된 파일 목록 확인
    $fileCount = (Get-ChildItem $dest -Recurse -File).Count
    Write-Host "  복사된 파일 수: $fileCount 개" -ForegroundColor Cyan
    
} catch {
    Write-Host ""
    Write-Host "❌ 오류 발생: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}



