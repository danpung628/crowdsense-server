/**
 * 주차장 좌표 및 MongoDB 히스토리 테스트
 */

const { generateCoordinatesFile } = require('./src/data/parkingCoordinatesLoader');
const mongoose = require('mongoose');
require('dotenv').config();

async function testSetup() {
  console.log('🧪 CrowdSense 초기 설정 테스트\n');
  
  // 1. 주차장 좌표 생성
  console.log('📍 Step 1: 주차장 좌표 생성');
  console.log('─'.repeat(50));
  try {
    const coords = await generateCoordinatesFile();
    console.log(`✅ 성공: ${Object.keys(coords).length}개 주차장 좌표 생성`);
    
    // 샘플 출력
    const samples = Object.entries(coords).slice(0, 3);
    console.log('\n📌 샘플 데이터:');
    samples.forEach(([id, data]) => {
      console.log(`  ${id}:`);
      console.log(`    이름: ${data.name}`);
      console.log(`    주소: ${data.address}`);
      console.log(`    좌표: (${data.lat}, ${data.lng})`);
    });
  } catch (error) {
    console.error('❌ 실패:', error.message);
  }
  
  // 2. MongoDB 연결 테스트
  console.log('\n\n💾 Step 2: MongoDB 연결 테스트');
  console.log('─'.repeat(50));
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crowdsense';
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB 연결 성공');
    console.log(`   - URI: ${MONGODB_URI}`);
    console.log(`   - Database: ${mongoose.connection.name}`);
    
    // 컬렉션 목록
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`   - 컬렉션: ${collections.map(c => c.name).join(', ') || '(없음)'}`);
    
    await mongoose.disconnect();
    console.log('✅ MongoDB 연결 해제');
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error.message);
  }
  
  console.log('\n\n✅ 초기 설정 완료!');
  console.log('서버를 시작하세요: npm run dev');
  
  process.exit(0);
}

testSetup();

