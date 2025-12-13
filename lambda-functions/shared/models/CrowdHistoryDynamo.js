const dynamoClient = require('../utils/dynamoClient');
const { PutCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.DYNAMODB_CROWD_HISTORY_TABLE_NAME || 'CrowdHistory';

class CrowdHistoryDynamo {
  /**
   * 히스토리 데이터 저장
   * @param {Object} data - 히스토리 데이터
   * @returns {Promise<Object>} 저장된 데이터
   */
  static async create(data) {
    try {
      const now = Date.now();
      const ttl = Math.floor(now / 1000) + (30 * 24 * 60 * 60); // 30일 후 TTL

      const item = {
        areaCode: data.areaCode,
        timestamp: now, // Partition Key: areaCode, Sort Key: timestamp
        areaName: data.areaName,
        category: data.category,
        peopleCount: data.peopleCount || 0,
        congestionLevel: data.congestionLevel || 3,
        rawData: data.rawData || null,
        ttl: ttl // DynamoDB TTL (Unix timestamp in seconds)
      };

      await dynamoClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: item
      }));

      return item;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 특정 지역의 히스토리 조회 (시간 범위)
   * @param {string} areaCode - 지역 코드
   * @param {Date} startTime - 시작 시간
   * @param {Date} endTime - 종료 시간 (선택)
   * @returns {Promise<Array>} 히스토리 데이터 배열
   */
  static async findByAreaCode(areaCode, startTime, endTime = null) {
    try {
      const startTimestamp = startTime.getTime();
      const endTimestamp = endTime ? endTime.getTime() : Date.now();

      const result = await dynamoClient.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'areaCode = :areaCode AND #ts BETWEEN :start AND :end',
        ExpressionAttributeNames: {
          '#ts': 'timestamp'
        },
        ExpressionAttributeValues: {
          ':areaCode': areaCode,
          ':start': startTimestamp,
          ':end': endTimestamp
        },
        ScanIndexForward: true // 오름차순 정렬
      }));

      return result.Items || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * 카테고리별 랭킹 조회 (Aggregation)
   * @param {number} hours - 조회할 시간 범위 (시간)
   * @param {string} category - 카테고리 (선택)
   * @param {number} limit - 제한 개수
   * @returns {Promise<Array>} 랭킹 데이터
   */
  static async getRankings(hours = 24, category = null, limit = 10) {
    try {
      const startTime = Date.now() - (hours * 60 * 60 * 1000);
      
      // Scan으로 모든 데이터 가져오기 (비효율적이지만 DynamoDB 제약)
      // 실제 운영에서는 GSI(Global Secondary Index) 사용 권장
      const result = await dynamoClient.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: '#ts >= :startTime' + (category ? ' AND category = :category' : ''),
        ExpressionAttributeNames: {
          '#ts': 'timestamp'
        },
        ExpressionAttributeValues: {
          ':startTime': startTime,
          ...(category ? { ':category': category } : {})
        }
      }));

      // 메모리에서 Aggregation 수행
      const items = result.Items || [];
      
      // areaCode별로 그룹화
      const grouped = {};
      items.forEach(item => {
        if (!grouped[item.areaCode]) {
          grouped[item.areaCode] = {
            areaCode: item.areaCode,
            areaName: item.areaName,
            category: item.category,
            peopleCounts: [],
            congestionLevels: []
          };
        }
        grouped[item.areaCode].peopleCounts.push(item.peopleCount);
        grouped[item.areaCode].congestionLevels.push(item.congestionLevel);
      });

      // 평균 계산 및 정렬
      const rankings = Object.values(grouped).map(group => ({
        areaCode: group.areaCode,
        areaName: group.areaName,
        category: group.category,
        avgPeople: Math.round(group.peopleCounts.reduce((a, b) => a + b, 0) / group.peopleCounts.length),
        maxPeople: Math.max(...group.peopleCounts),
        avgCongestion: Math.round((group.congestionLevels.reduce((a, b) => a + b, 0) / group.congestionLevels.length) * 10) / 10
      }));

      // 평균 인구수 기준 내림차순 정렬
      rankings.sort((a, b) => b.avgPeople - a.avgPeople);

      return limit ? rankings.slice(0, limit) : rankings;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CrowdHistoryDynamo;

