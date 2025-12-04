const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

// AWS 리전 설정 (서울: ap-northeast-2)
const REGION = process.env.AWS_REGION || 'ap-northeast-2';

// DynamoDB 클라이언트 생성
const client = new DynamoDBClient({
  region: REGION,
  // 로컬 개발 시: endpoint: 'http://localhost:8000' (DynamoDB Local 사용 시)
});

// Document Client: JavaScript 객체를 DynamoDB 형식으로 자동 변환
const docClient = DynamoDBDocumentClient.from(client);

/**
 * DynamoDB 클라이언트 가져오기
 * Redis 클라이언트와 비슷한 패턴
 */
function getDynamoClient() {
  return docClient;
}

module.exports = {
  getDynamoClient,
};

