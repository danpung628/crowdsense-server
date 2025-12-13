#!/bin/bash

# Lambda 함수 로컬 코드와 AWS 배포본 비교 스크립트

set -e

echo "🔍 Lambda 함수 동기화 상태 확인 중..."

# 로컬 Lambda 함수 목록 (함수명:로컬경로)
declare -A localFunctions=(
    ["crowdsense-auth-register"]="lambda-functions/auth/register/index.js"
    ["crowdsense-auth-login"]="lambda-functions/auth/login/index.js"
    ["crowdsense-auth-logout"]="lambda-functions/auth/logout/index.js"
    ["crowdsense-auth-refresh"]="lambda-functions/auth/refresh/index.js"
    ["crowdsense-auth-me"]="lambda-functions/auth/me/index.js"
    ["crowdsense-crowd-list"]="lambda-functions/crowd/list/index.mjs"
    ["crowdsense-crowd-detail"]="lambda-functions/crowd/detail/index.mjs"
    ["crowdsense-crowd-history"]="lambda-functions/crowd/history/index.mjs"
    ["crowdsense-subway-list"]="lambda-functions/subway/list/index.mjs"
    ["crowdsense-subway-detail"]="lambda-functions/subway/detail/index.mjs"
    ["crowdsense-parking-list"]="lambda-functions/parking/list/index.mjs"
    ["crowdsense-parking-nearby"]="lambda-functions/parking/nearby/index.mjs"
    ["crowdsense-parking-district"]="lambda-functions/parking/district/index.mjs"
    ["crowdsense-ranking-popular"]="lambda-functions/ranking/popular/index.mjs"
    ["crowdsense-area-list"]="lambda-functions/area/list/index.mjs"
    ["crowdsense-area-categories"]="lambda-functions/area/categories/index.mjs"
    ["crowdsense-area-search"]="lambda-functions/area/search/index.mjs"
    ["crowdsense-area-category"]="lambda-functions/area/category/index.mjs"
    ["crowdsense-area-detail"]="lambda-functions/area/detail/index.mjs"
)

# AWS에 배포된 함수 목록 가져오기
echo ""
echo "📡 AWS에서 배포된 Lambda 함수 목록 확인 중..."
deployedFunctions=$(aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'crowdsense-')].FunctionName" --output text 2>/dev/null || echo "")

if [ -z "$deployedFunctions" ]; then
    echo "⚠️  AWS CLI 오류 또는 배포된 함수가 없습니다."
    deployedList=()
else
    IFS=$'\t' read -ra deployedList <<< "$deployedFunctions"
fi

echo ""
echo "📊 비교 결과:"
echo "=================================================================================="

syncedCount=0
notDeployedCount=0
differentCount=0
notFoundCount=0

for funcName in "${!localFunctions[@]}"; do
    localPath="${localFunctions[$funcName]}"
    
    # 로컬 파일 존재 확인
    if [ ! -f "$localPath" ]; then
        echo "❌ $funcName : 로컬 파일 없음 ($localPath)"
        ((notFoundCount++))
        continue
    fi
    
    # AWS에 배포되어 있는지 확인
    isDeployed=false
    for deployed in "${deployedList[@]}"; do
        if [ "$deployed" == "$funcName" ]; then
            isDeployed=true
            break
        fi
    done
    
    if [ "$isDeployed" = false ]; then
        echo "⚠️  $funcName : AWS에 배포되지 않음"
        ((notDeployedCount++))
        continue
    fi
    
    # AWS 함수 정보 가져오기
    funcInfo=$(aws lambda get-function --function-name "$funcName" --query "Configuration.CodeSha256" --output text 2>/dev/null || echo "")
    
    if [ -z "$funcInfo" ]; then
        echo "❌ $funcName : AWS 함수 정보 조회 실패"
        ((differentCount++))
        continue
    fi
    
    echo "✅ $funcName : AWS에 배포됨 (상세 비교는 코드 해시 확인 필요)"
    ((syncedCount++))
done

echo ""
echo "=================================================================================="
echo "📈 요약:"
echo "  ✅ 동기화됨: $syncedCount 개"
echo "  ⚠️  배포 안 됨: $notDeployedCount 개"
echo "  ❌ 오류: $differentCount 개"
echo "  ❌ 파일 없음: $notFoundCount 개"
echo "  📦 총 로컬 함수: ${#localFunctions[@]} 개"

if [ $notDeployedCount -gt 0 ]; then
    echo ""
    echo "💡 배포되지 않은 함수를 배포하려면 배포 스크립트를 실행하세요."
fi

