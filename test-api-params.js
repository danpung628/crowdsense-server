const axios = require('axios');

const apiKey = '47464b765073696c33366142537a7a';
const baseUrl = 'http://openapi.seoul.go.kr:8088';
const areaCode = 'POI001';

async function test() {
  console.log('🔍 API 파라미터 테스트 시작...\n');
  
  // 테스트 1: 1/1로 호출
  try {
    console.log('=== 테스트 1: 1/1로 호출 ===');
    const res1 = await axios.get(`${baseUrl}/${apiKey}/JSON/citydata_ppltn/1/1/${areaCode}`, { timeout: 10000 });
    const data1 = res1.data?.['SeoulRtd.citydata_ppltn'];
    console.log('✅ 성공!');
    console.log('   배열 길이:', data1?.length || 0);
    console.log('   list_total_count:', res1.data?.list_total_count);
    if (data1 && data1.length > 0) {
      console.log('   첫 번째 항목 키:', Object.keys(data1[0]).slice(0, 5).join(', '));
    }
  } catch(e) {
    console.log('❌ 1/1 실패:', e.response?.status, e.response?.data?.RESULT?.CODE || e.message);
  }
  
  // 테스트 2: 1/5로 호출
  try {
    console.log('\n=== 테스트 2: 1/5로 호출 ===');
    const res2 = await axios.get(`${baseUrl}/${apiKey}/JSON/citydata_ppltn/1/5/${areaCode}`, { timeout: 10000 });
    const data2 = res2.data?.['SeoulRtd.citydata_ppltn'];
    console.log('✅ 성공!');
    console.log('   배열 길이:', data2?.length || 0);
    console.log('   list_total_count:', res2.data?.list_total_count);
    if (data2 && data2.length > 0) {
      console.log('   첫 번째 항목 키:', Object.keys(data2[0]).slice(0, 5).join(', '));
    }
  } catch(e) {
    console.log('❌ 1/5 실패:', e.response?.status, e.response?.data?.RESULT?.CODE || e.message);
  }
  
  // 테스트 3: 1/10으로 호출
  try {
    console.log('\n=== 테스트 3: 1/10으로 호출 ===');
    const res3 = await axios.get(`${baseUrl}/${apiKey}/JSON/citydata_ppltn/1/10/${areaCode}`, { timeout: 10000 });
    const data3 = res3.data?.['SeoulRtd.citydata_ppltn'];
    console.log('✅ 성공!');
    console.log('   배열 길이:', data3?.length || 0);
    console.log('   list_total_count:', res3.data?.list_total_count);
  } catch(e) {
    console.log('❌ 1/10 실패:', e.response?.status, e.response?.data?.RESULT?.CODE || e.message);
  }
  
  console.log('\n📊 결론:');
  console.log('   - 1/1이 성공하면: 1/5는 형식상 필요 없음');
  console.log('   - 1/1이 실패하면: 1/5가 최소 요구사항');
}

test().catch(console.error);
