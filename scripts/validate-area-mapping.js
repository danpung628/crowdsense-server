/**
 * Area 매핑 검증 스크립트
 * 
 * CSV 파일의 POI 코드가 실제 공공 API에서 사용 가능한지 확인
 * - 공공 API 호출 테스트
 * - CSV의 모든 areaCode 검증
 * - 누락된 코드 확인
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.SEOUL_API_KEY || '47464b765073696c33366142537a7a';
const BASE_URL = process.env.SEOUL_POPULATION_API_URL || 'http://openapi.seoul.go.kr:8088';

// CSV 파일 읽기
function loadCSV() {
  const csvPath = path.join(__dirname, '../server/areacode.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  
  const areas = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split(',');
    if (columns.length >= 5) {
      areas.push({
        category: columns[0].trim(),
        no: parseInt(columns[1].trim()),
        areaCode: columns[2].trim(),
        areaName: columns[3].trim(),
        engName: columns[4].trim()
      });
    }
  }
  
  return areas;
}

// 공공 API 호출 테스트
async function testAreaCode(areaCode) {
  try {
    const url = `${BASE_URL}/${API_KEY}/JSON/citydata_ppltn/1/5/${areaCode}`;
    const response = await axios.get(url, { timeout: 10000 });
    
    const data = response.data?.['SeoulRtd.citydata_ppltn'];
    const result = response.data?.RESULT;
    
    if (result && result.CODE !== 'INFO-000') {
      return {
        success: false,
        error: result.MESSAGE || result.CODE,
        hasData: false
      };
    }
    
    return {
      success: true,
      hasData: data && data.length > 0,
      areaName: data?.[0]?.AREA_NM || null,
      areaCodeFromAPI: data?.[0]?.AREA_CD || null
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      hasData: false
    };
  }
}

// 메인 검증 함수
async function validateMapping() {
  console.log('🔍 Area 매핑 검증 시작...\n');
  
  const areas = loadCSV();
  console.log(`📋 CSV에서 ${areas.length}개 지역 로드됨\n`);
  
  const results = {
    total: areas.length,
    success: 0,
    failed: 0,
    noData: 0,
    details: []
  };
  
  // 샘플 검증 (처음 10개만 빠르게 테스트)
  const sampleSize = process.argv[2] ? parseInt(process.argv[2]) : 10;
  const testAreas = areas.slice(0, sampleSize);
  
  console.log(`🧪 샘플 ${testAreas.length}개 검증 중...\n`);
  
  for (const area of testAreas) {
    process.stdout.write(`테스트 중: ${area.areaCode} (${area.areaName})... `);
    
    const result = await testAreaCode(area.areaCode);
    
    if (result.success) {
      if (result.hasData) {
        results.success++;
        const apiAreaName = result.areaName;
        const csvAreaName = area.areaName;
        
        // API 응답의 지역명과 CSV의 지역명 비교
        const nameMatch = apiAreaName && (
          apiAreaName.includes(csvAreaName) || 
          csvAreaName.includes(apiAreaName) ||
          apiAreaName === csvAreaName
        );
        
        results.details.push({
          areaCode: area.areaCode,
          csvName: csvAreaName,
          apiName: apiAreaName,
          match: nameMatch ? '✅' : '⚠️',
          status: 'OK'
        });
        
        console.log(`✅ OK (API: ${apiAreaName || 'N/A'})`);
      } else {
        results.noData++;
        results.details.push({
          areaCode: area.areaCode,
          csvName: area.areaName,
          apiName: null,
          match: '❌',
          status: 'NO_DATA'
        });
        console.log(`❌ 데이터 없음`);
      }
    } else {
      results.failed++;
      results.details.push({
        areaCode: area.areaCode,
        csvName: area.areaName,
        apiName: null,
        match: '❌',
        status: 'ERROR',
        error: result.error
      });
      console.log(`❌ 실패: ${result.error}`);
    }
    
    // API 부하 방지를 위한 딜레이
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 검증 결과 요약');
  console.log('='.repeat(60));
  console.log(`전체: ${results.total}개`);
  console.log(`검증: ${testAreas.length}개`);
  console.log(`✅ 성공: ${results.success}개`);
  console.log(`❌ 실패: ${results.failed}개`);
  console.log(`⚠️  데이터 없음: ${results.noData}개`);
  console.log('\n');
  
  // 상세 결과
  console.log('📋 상세 결과:');
  results.details.forEach(detail => {
    console.log(`${detail.match} ${detail.areaCode}: ${detail.csvName}`);
    if (detail.apiName) {
      console.log(`   API 응답: ${detail.apiName}`);
    }
    if (detail.error) {
      console.log(`   에러: ${detail.error}`);
    }
  });
  
  // 매칭 확인
  const nameMismatches = results.details.filter(d => d.match === '⚠️');
  if (nameMismatches.length > 0) {
    console.log('\n⚠️  지역명 불일치:');
    nameMismatches.forEach(d => {
      console.log(`   ${d.areaCode}: CSV="${d.csvName}" vs API="${d.apiName}"`);
    });
  }
  
  console.log('\n💡 전체 검증을 원하면: node scripts/validate-area-mapping.js 128');
}

// 실행
validateMapping().catch(console.error);
