const dynamoClient = require('../utils/dynamoClient');
const { PutCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const areaMapping = require('../utils/areaMapping');

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
   * 카테고리별 랭킹 조회 (Aggregation) - 최적화된 버전
   * 각 areaCode별로 Query를 병렬 수행하여 Scan보다 훨씬 빠름
   * @param {number} hours - 조회할 시간 범위 (시간)
   * @param {string} category - 카테고리 (선택)
   * @param {number} limit - 제한 개수
   * @returns {Promise<Array>} 랭킹 데이터
   */
  static async getRankings(hours = 24, category = null, limit = 10) {
    try {
      const startTime = Date.now() - (hours * 60 * 60 * 1000);
      
      // 모든 areaCode 목록 가져오기
      const allAreas = areaMapping.getAllAreas();
      
      // 카테고리 필터링 (있는 경우)
      const targetAreaCodes = category 
        ? allAreas.filter(area => area.category === category).map(area => area.areaCode)
        : allAreas.map(area => area.areaCode);
      
      // 각 areaCode별로 Query 병렬 수행
      const queryPromises = targetAreaCodes.map(areaCode => 
        dynamoClient.send(new QueryCommand({
        TableName: TABLE_NAME,
          KeyConditionExpression: 'areaCode = :areaCode AND #ts >= :startTime',
        ExpressionAttributeNames: {
          '#ts': 'timestamp'
        },
        ExpressionAttributeValues: {
            ':areaCode': areaCode,
            ':startTime': startTime
        }
        })).then(result => ({
          areaCode,
          items: result.Items || []
        })).catch(error => {
          console.error(`Query failed for ${areaCode}:`, error);
          return { areaCode, items: [] };
        })
      );
      
      // 모든 Query 결과를 병렬로 기다림
      const results = await Promise.all(queryPromises);
      
      // areaCode별로 그룹화 및 집계
      const grouped = {};
      results.forEach(({ areaCode, items }) => {
        if (items.length === 0) return;
        
        const areaInfo = areaMapping.getAreaByCode(areaCode);
        if (!areaInfo) return;
        
        // 카테고리 필터링 (추가 확인)
        if (category && areaInfo.category !== category) return;
        
        if (!grouped[areaCode]) {
          grouped[areaCode] = {
            areaCode,
            areaName: areaInfo.areaName || areaCode,
            category: areaInfo.category,
            peopleCounts: [],
            congestionLevels: []
          };
        }
        
        items.forEach(item => {
          grouped[areaCode].peopleCounts.push(item.peopleCount || 0);
          grouped[areaCode].congestionLevels.push(item.congestionLevel || 3);
        });
      });

      // 평균 계산 및 정렬
      const rankings = Object.values(grouped)
        .filter(group => group.peopleCounts.length > 0) // 데이터가 있는 것만
        .map(group => ({
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

