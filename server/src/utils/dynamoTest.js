/**
 * DynamoDB 테스트 파일
 * 실제 테이블 없이도 클라이언트가 제대로 작동하는지 확인
 */

const { getDynamoClient } = require('./dynamoClient');

async function testDynamoClient() {
  console.log('🧪 DynamoDB 클라이언트 테스트 시작...\n');

  try {
    const client = getDynamoClient();
    console.log('✅ DynamoDB 클라이언트 생성 성공');
    console.log(`   - 클라이언트 타입: ${client.constructor.name}`);
    
    // 실제 테이블이 없어도 클라이언트는 생성됨
    // 테이블은 나중에 AWS 콘솔에서 만들 예정
    console.log('\n📝 다음 단계:');
    console.log('   1. AWS 콘솔에서 DynamoDB 테이블 생성');
    console.log('   2. 테이블 이름을 환경변수에 설정');
    console.log('   3. 실제 데이터 저장/조회 테스트');
    
    return true;
  } catch (error) {
    console.error('❌ DynamoDB 클라이언트 생성 실패:', error.message);
    return false;
  }
}

// 직접 실행 시 테스트
if (require.main === module) {
  testDynamoClient()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('테스트 실패:', error);
      process.exit(1);
    });
}

module.exports = { testDynamoClient };

