const dynamoClient = require('../utils/dynamoClient');
const bcrypt = require('bcryptjs');
const { PutCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'Users';

class UserDynamo {
  /**
   * 사용자 생성
   * @param {string} id - 사용자 ID
   * @param {string} password - 평문 비밀번호
   * @returns {Promise<Object>} 생성된 사용자 정보
   */
  static async createUser(id, password) {
    try {
      // 비밀번호 해싱
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const now = Date.now();
      const user = {
        id,
        password: hashedPassword,
        accessToken: null,
        refreshToken: null,
        createdAt: now,
        updatedAt: now
      };

      // DynamoDB에 저장 (조건: id가 존재하지 않을 때만)
      await dynamoClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: user,
        ConditionExpression: 'attribute_not_exists(id)'
      }));

      // 비밀번호 제외하고 반환
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error('이미 존재하는 사용자 ID입니다.');
      }
      throw error;
    }
  }

  /**
   * ID로 사용자 조회
   * @param {string} id - 사용자 ID
   * @returns {Promise<Object|null>} 사용자 정보 또는 null
   */
  static async getUserById(id) {
    try {
      const result = await dynamoClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { id }
      }));

      return result.Item || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 토큰 업데이트
   * @param {string} id - 사용자 ID
   * @param {string} accessToken - Access Token
   * @param {string} refreshToken - Refresh Token
   * @returns {Promise<Object>} 업데이트된 사용자 정보
   */
  static async updateTokens(id, accessToken, refreshToken) {
    try {
      const now = Date.now();
      const result = await dynamoClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: 'SET accessToken = :accessToken, refreshToken = :refreshToken, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':accessToken': accessToken,
          ':refreshToken': refreshToken,
          ':updatedAt': now
        },
        ReturnValues: 'ALL_NEW'
      }));

      const user = result.Attributes;
      // 비밀번호 제외하고 반환
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 토큰 초기화
   * @param {string} id - 사용자 ID
   * @returns {Promise<Object>} 업데이트된 사용자 정보
   */
  static async clearTokens(id) {
    try {
      const now = Date.now();
      const result = await dynamoClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: 'SET accessToken = :null, refreshToken = :null, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':null': null,
          ':updatedAt': now
        },
        ReturnValues: 'ALL_NEW'
      }));

      const user = result.Attributes;
      // 비밀번호 제외하고 반환
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 비밀번호 비교
   * @param {Object} user - 사용자 객체 (password 필드 포함)
   * @param {string} candidatePassword - 비교할 평문 비밀번호
   * @returns {Promise<boolean>} 비밀번호 일치 여부
   */
  static async comparePassword(user, candidatePassword) {
    if (!user || !user.password) {
      return false;
    }
    return await bcrypt.compare(candidatePassword, user.password);
  }
}

module.exports = UserDynamo;

