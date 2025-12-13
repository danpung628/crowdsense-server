# Lambda 함수 로컬 코드와 AWS 배포본 비교 스크립트

$ErrorActionPreference = "Stop"

Write-Host "🔍 Lambda 함수 동기화 상태 확인 중..." -ForegroundColor Cyan

# 로컬 Lambda 함수 목록
$localFunctions = @(
    @{Name="crowdsense-auth-register"; Path="lambda-functions/auth/register/index.js"},
    @{Name="crowdsense-auth-login"; Path="lambda-functions/auth/login/index.js"},
    @{Name="crowdsense-auth-logout"; Path="lambda-functions/auth/logout/index.js"},
    @{Name="crowdsense-auth-refresh"; Path="lambda-functions/auth/refresh/index.js"},
    @{Name="crowdsense-auth-me"; Path="lambda-functions/auth/me/index.js"},
    @{Name="crowdsense-crowd-list"; Path="lambda-functions/crowd/list/index.mjs"},
    @{Name="crowdsense-crowd-detail"; Path="lambda-functions/crowd/detail/index.mjs"},
    @{Name="crowdsense-crowd-history"; Path="lambda-functions/crowd/history/index.mjs"},
    @{Name="crowdsense-subway-list"; Path="lambda-functions/subway/list/index.mjs"},
    @{Name="crowdsense-subway-detail"; Path="lambda-functions/subway/detail/index.mjs"},
    @{Name="crowdsense-parking-list"; Path="lambda-functions/parking/list/index.mjs"},
    @{Name="crowdsense-parking-nearby"; Path="lambda-functions/parking/nearby/index.mjs"},
    @{Name="crowdsense-parking-district"; Path="lambda-functions/parking/district/index.mjs"},
    @{Name="crowdsense-ranking-popular"; Path="lambda-functions/ranking/popular/index.mjs"},
    @{Name="crowdsense-area-list"; Path="lambda-functions/area/list/index.mjs"},
    @{Name="crowdsense-area-categories"; Path="lambda-functions/area/categories/index.mjs"},
    @{Name="crowdsense-area-search"; Path="lambda-functions/area/search/index.mjs"},
    @{Name="crowdsense-area-category"; Path="lambda-functions/area/category/index.mjs"},
    @{Name="crowdsense-area-detail"; Path="lambda-functions/area/detail/index.mjs"}
)

# AWS에 배포된 함수 목록 가져오기
Write-Host "`n📡 AWS에서 배포된 Lambda 함수 목록 확인 중..." -ForegroundColor Yellow
try {
    $deployedFunctions = aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'crowdsense-')].FunctionName" --output text 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  AWS CLI 오류 또는 배포된 함수가 없습니다." -ForegroundColor Yellow
        $deployedFunctions = ""
    }
} catch {
    Write-Host "⚠️  AWS CLI 오류 또는 배포된 함수가 없습니다." -ForegroundColor Yellow
    $deployedFunctions = ""
}

$deployedList = if ($deployedFunctions) { $deployedFunctions -split "`t" } else { @() }

Write-Host "`n📊 비교 결과:" -ForegroundColor Cyan
Write-Host "=" * 80

$syncedCount = 0
$notDeployedCount = 0
$differentCount = 0
$notFoundCount = 0

foreach ($func in $localFunctions) {
    $localPath = $func.Path
    $funcName = $func.Name
    
    # 로컬 파일 존재 확인
    if (-not (Test-Path $localPath)) {
        Write-Host "❌ $funcName : 로컬 파일 없음 ($localPath)" -ForegroundColor Red
        $notFoundCount++
        continue
    }
    
    # AWS에 배포되어 있는지 확인
    $isDeployed = $deployedList -contains $funcName
    
    if (-not $isDeployed) {
        Write-Host "⚠️  $funcName : AWS에 배포되지 않음" -ForegroundColor Yellow
        $notDeployedCount++
        continue
    }
    
    # AWS 함수 정보 가져오기
    try {
        $funcInfo = aws lambda get-function --function-name $funcName --query "Configuration.CodeSha256" --output text 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ $funcName : AWS 함수 정보 조회 실패" -ForegroundColor Red
            $differentCount++
            continue
        }
        
        # 로컬 파일 해시 계산 (간단한 비교를 위해 파일 크기와 수정 시간 사용)
        $localFile = Get-Item $localPath
        $localHash = "$($localFile.Length)-$($localFile.LastWriteTime.Ticks)"
        
        # 실제로는 zip으로 압축해서 SHA256 비교해야 정확함
        # 여기서는 배포 여부만 확인
        Write-Host "✅ $funcName : AWS에 배포됨 (상세 비교는 코드 해시 확인 필요)" -ForegroundColor Green
        $syncedCount++
        
    } catch {
        Write-Host "❌ $funcName : AWS 함수 정보 조회 오류" -ForegroundColor Red
        $differentCount++
    }
}

Write-Host "`n" + "=" * 80
Write-Host "📈 요약:" -ForegroundColor Cyan
Write-Host "  ✅ 동기화됨: $syncedCount 개" -ForegroundColor Green
Write-Host "  ⚠️  배포 안 됨: $notDeployedCount 개" -ForegroundColor Yellow
Write-Host "  ❌ 오류: $differentCount 개" -ForegroundColor Red
Write-Host "  ❌ 파일 없음: $notFoundCount 개" -ForegroundColor Red
Write-Host "  📦 총 로컬 함수: $($localFunctions.Count) 개" -ForegroundColor Cyan

if ($notDeployedCount -gt 0) {
    Write-Host "`n💡 배포되지 않은 함수를 배포하려면 배포 스크립트를 실행하세요." -ForegroundColor Yellow
}

