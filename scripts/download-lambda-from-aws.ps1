# AWS Lambda 함수 코드를 다운로드하여 로컬 파일 덮어쓰기

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

$mappings = @{
    "auth-register" = "lambda-functions/auth/register/index.js"
    "auth-login" = "lambda-functions/auth/login/index.js"
    "auth-logout" = "lambda-functions/auth/logout/index.js"
    "auth-refresh" = "lambda-functions/auth/refresh/index.js"
    "auth-me" = "lambda-functions/auth/me/index.js"
    "crowd-list" = "lambda-functions/crowd/list/index.mjs"
    "crowd-detail" = "lambda-functions/crowd/detail/index.mjs"
    "crowd-history" = "lambda-functions/crowd/history/index.mjs"
    "subway-list" = "lambda-functions/subway/list/index.mjs"
    "subway-datail" = "lambda-functions/subway/detail/index.mjs"
    "parking-list" = "lambda-functions/parking/list/index.mjs"
    "parking-nearby" = "lambda-functions/parking/nearby/index.mjs"
    "parking-district" = "lambda-functions/parking/district/index.mjs"
    "ranking-popular" = "lambda-functions/ranking/popular/index.mjs"
    "area-list" = "lambda-functions/area/list/index.mjs"
    "area-categories" = "lambda-functions/area/categories/index.mjs"
    "area-search" = "lambda-functions/area/search/index.mjs"
    "area-category" = "lambda-functions/area/category/index.mjs"
    "area-detail" = "lambda-functions/area/detail/index.mjs"
}

Write-Host "AWS Lambda 함수 코드 다운로드 시작..." -ForegroundColor Cyan
Write-Host "리전: $region" -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($funcName in $mappings.Keys) {
    $localPath = $mappings[$funcName]
    Write-Host "다운로드 중: $funcName" -ForegroundColor Yellow
    
    try {
        # 코드 다운로드 URL 가져오기
        $codeUrl = aws lambda get-function --function-name $funcName --region $region --query "Code.Location" --output text 2>$null
        
        if ($LASTEXITCODE -ne 0 -or -not $codeUrl) {
            Write-Host "  실패: 다운로드 URL 가져오기 실패" -ForegroundColor Red
            $failCount++
            continue
        }
        
        # 임시 파일 경로
        $tempZip = "$env:TEMP\$funcName.zip"
        $tempDir = "$env:TEMP\$funcName"
        
        # ZIP 다운로드
        Invoke-WebRequest -Uri $codeUrl -OutFile $tempZip -ErrorAction Stop
        
        # ZIP 압축 해제
        Expand-Archive -Path $tempZip -DestinationPath $tempDir -Force -ErrorAction Stop
        
        # 파일 이름 확인
        $fileName = Split-Path $localPath -Leaf
        $sourceFile = Join-Path $tempDir $fileName
        
        if (Test-Path $sourceFile) {
            # 로컬 파일 덮어쓰기
            Get-Content $sourceFile -Raw | Set-Content $localPath -Encoding UTF8 -NoNewline
            Write-Host "  완료: $funcName" -ForegroundColor Green
            $successCount++
        } else {
            # 다른 파일 이름 시도
            $allFiles = Get-ChildItem $tempDir -File
            if ($allFiles.Count -eq 1) {
                $actualFile = $allFiles[0].FullName
                Get-Content $actualFile -Raw | Set-Content $localPath -Encoding UTF8 -NoNewline
                Write-Host "  완료: $funcName (파일명: $($allFiles[0].Name))" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host "  실패: 파일을 찾을 수 없음" -ForegroundColor Red
                $failCount++
            }
        }
        
        # 임시 파일 정리
        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
        
    } catch {
        Write-Host "  실패: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "다운로드 완료!" -ForegroundColor Cyan
Write-Host "  성공: $successCount 개" -ForegroundColor Green
Write-Host "  실패: $failCount 개" -ForegroundColor Red

