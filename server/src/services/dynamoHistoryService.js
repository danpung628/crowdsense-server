/**
 * DynamoDB를 사용한 CrowdHistory 서비스
 * MongoDB의 CrowdHistory 모델을 DynamoDB로 대체
 */

const { getDynamoClient } = require('../utils/dynamoClient');

// 테이블 이름 (환경변수에서 가져오거나 기본값 사용)
const TABLE_NAME = process.env.DYNAMODB_TABLE_CROWD_HISTORY || 'CrowdHistory';

class DynamoHistoryService {
  constructor() {
    this.client = getDynamoClient();
    this.tableName = TABLE_NAME;
  }

  /**
   * 히스토리 데이터 저장
   * MongoDB의 CrowdHistory.create()와 동일한 기능
   */
  async create(data) {
    const {
      areaCode,      // 필수: Partition Key
      areaName,      // 필수
      category,      // 필수
      peopleCount,   // 필수
      congestionLevel, // 필수
      timestamp      // 필수: Sort Key (없으면 현재 시간)
    } = data;

    // timestamp가 없으면 현재 시간 사용
    const ts = timestamp ? new Date(timestamp).getTime() : Date.now();
    
    // TTL 계산: 30일 후 (초 단위)
    const ttlSeconds = Math.floor(ts / 1000) + (30 * 24 * 60 * 60);

    const item = {
      areaCode,           // Partition Key
      timestamp: ts,      // Sort Key
      areaName,
      category,
      peopleCount,
      congestionLevel,
      ttl: ttlSeconds     // 30일 후 자동 삭제
    };

    try {
      await this.client.put({
        TableName: this.tableName,
        Item: item
      });

      return item;
    } catch (error) {
      console.error('DynamoDB 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 지역의 히스토리 조회
   * MongoDB의 find({ areaCode, timestamp: { $gte: startTime } })와 동일
   */
  async findByAreaCode(areaCode, startTime = null) {
    const startTimestamp = startTime 
      ? new Date(startTime).getTime() 
      : Date.now() - (24 * 60 * 60 * 1000); // 기본: 24시간 전

    try {
      const result = await this.client.query({
        TableName: this.tableName,
        KeyConditionExpression: 'areaCode = :areaCode AND #ts >= :startTime',
        ExpressionAttributeNames: {
          '#ts': 'timestamp'  // timestamp는 예약어라서 #ts로 사용
        },
        ExpressionAttributeValues: {
          ':areaCode': areaCode,
          ':startTime': startTimestamp
        },
        ScanIndexForward: true  // 오름차순 정렬 (시간순)
      });

      return result.Items || [];
    } catch (error) {
      console.error('DynamoDB 조회 실패:', error);
      throw error;
    }
  }
}

module.exports = new DynamoHistoryService();

