/**
 * DynamoDB 사용 예제
 * MongoDB와 비교해서 이해하기 쉽게 작성
 */

const dynamoHistoryService = require('../services/dynamoHistoryService');

async function example() {
  console.log('📚 DynamoDB 사용 예제\n');

  // ============================================
  // 예제 1: 데이터 저장
  // ============================================
  console.log('1️⃣ 데이터 저장 예제');
  console.log('─'.repeat(50));
  
  const saveExample = {
    areaCode: 'POI001',
    areaName: '강남역',
    category: '지하철역',
    peopleCount: 5000,
    congestionLevel: 4,
    timestamp: new Date()  // 없으면 자동으로 현재 시간
  };

  console.log('저장할 데이터:');
  console.log(JSON.stringify(saveExample, null, 2));
  
  console.log('\n💡 MongoDB와 비교:');
  console.log('   MongoDB: await CrowdHistory.create(saveExample)');
  console.log('   DynamoDB: await dynamoHistoryService.create(saveExample)');
  console.log('   → 거의 동일합니다!');

  // 실제 저장은 테이블이 있어야 함
  // await dynamoHistoryService.create(saveExample);

  // ============================================
  // 예제 2: 데이터 조회
  // ============================================
  console.log('\n\n2️⃣ 데이터 조회 예제');
  console.log('─'.repeat(50));
  
  const areaCode = 'POI001';
  const hours = 24;  // 최근 24시간
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

  console.log(`조회 조건: areaCode = "${areaCode}", 최근 ${hours}시간`);
  
  console.log('\n💡 MongoDB와 비교:');
  console.log('   MongoDB:');
  console.log('   await CrowdHistory.find({');
  console.log('     areaCode,');
  console.log('     timestamp: { $gte: startTime }');
  console.log('   })');
  console.log('');
  console.log('   DynamoDB:');
  console.log('   await dynamoHistoryService.findByAreaCode(areaCode, startTime)');
  console.log('   → 더 간단합니다!');

  // 실제 조회는 테이블이 있어야 함
  // const results = await dynamoHistoryService.findByAreaCode(areaCode, startTime);

  console.log('\n\n✅ 예제 완료!');
  console.log('📝 다음 단계: AWS 콘솔에서 테이블 생성 후 실제 테스트');
}

// 직접 실행 시
if (require.main === module) {
  example()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('예제 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { example };

