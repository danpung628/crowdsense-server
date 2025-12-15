const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

// AWS 리전 설정 (환경 변수에서 가져오거나 기본값 사용)
const region = process.env.AWS_REGION || 'ap-northeast-2';

// DynamoDB 클라이언트 생성
const client = new DynamoDBClient({ region });

// Document Client 생성 (자동으로 JavaScript 타입 변환)
const dynamoClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

module.exports = dynamoClient;

