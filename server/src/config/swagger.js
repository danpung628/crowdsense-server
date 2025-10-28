const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CrowdSense API',
      version: '1.0.0',
      description: '서울시 인구 밀집도, 지하철 혼잡도, 주차장 가용 정보 제공 API',
      contact: {
        name: 'CrowdSense Team',
        url: 'https://github.com/danpung628/crowdsense-server',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '개발 서버',
      },
      {
        url: 'https://api.crowdsense.com',
        description: '프로덕션 서버',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT 토큰 입력 (Bearer 제외)',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'ERROR_CODE',
                },
                message: {
                  type: 'string',
                  example: '에러 메시지',
                },
              },
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: '인증 관련 API',
      },
      {
        name: 'Crowds',
        description: '인구 밀집도 API',
      },
      {
        name: 'Subway',
        description: '지하철 혼잡도 API',
      },
      {
        name: 'Parking',
        description: '주차장 정보 API',
      },
      {
        name: 'Areas',
        description: '지역 정보 API',
      },
      {
        name: 'Rankings',
        description: '인기 장소 랭킹 API',
      },
      {
        name: 'Backups',
        description: 'S3 백업 관리 API (MongoDB 히스토리 데이터 백업)',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // 라우트 파일에서 Swagger 주석 읽기
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

