// // Lambda Layer 경로 우선 시도, 없으면 상대 경로 사용
// let authService, handleLambdaError;
// try {
//   // Lambda Layer 경로 (/opt/nodejs/)
//   authService = require('/opt/nodejs/services/authService');
//   handleLambdaError = require('/opt/nodejs/utils/errorHandler').handleLambdaError;
// } catch (e) {
//   // 로컬 개발용 상대 경로
//   authService = require('../../shared/services/authService');
//   handleLambdaError = require('../../shared/utils/errorHandler').handleLambdaError;
// }
//import authService from '/opt/nodejs/SHARED/services/authService.js';
const authService = require('/opt/nodejs/shared/services/authService.js');
const { handleLambdaError } = require('/opt/nodejs/shared/utils/errorHandler.js');
exports.handler = async (event) => {
  try {
    // 요청 본문 파싱
    const body = JSON.parse(event.body || '{}');
    const { id, password } = body;

    // 입력값 검증
    if (!id || !password) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '사용자 ID와 비밀번호를 모두 입력해주세요.'
          }
        })
      };
    }

    if (id.length < 3 || id.length > 50) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '사용자 ID는 3-50자 사이여야 합니다.'
          }
        })
      };
    }

    if (password.length < 6) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '비밀번호는 최소 6자 이상이어야 합니다.'
          }
        })
      };
    }

    // 회원가입 처리
    const result = await authService.register(id, password);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    const errorResponse = handleLambdaError(error);
    return {
      ...errorResponse,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
};

// const fs = require('fs');

// exports.handler = async (event) => {
//     console.log("--- 1. /opt 폴더 내용 ---");
//     try {
//         console.log(fs.readdirSync('/opt'));
//     } catch (e) { console.log("/opt 못 읽음", e.message); }

//     console.log("--- 2. /opt/nodejs 폴더 내용 ---");
//     try {
//         console.log(fs.readdirSync('/opt/nodejs'));
//     } catch (e) { console.log("/opt/nodejs 못 읽음 (압축 구조 문제 가능성)", e.message); }

//     console.log("--- 3. /opt/nodejs/SHARED 폴더 내용 ---");
//     try {
//         // 여기에 SHARED 대신 실제 폴더명이 보일 수 있습니다.
//         console.log(fs.readdirSync('/opt/nodejs/SHARED')); 
//     } catch (e) { console.log("/opt/nodejs/SHARED 못 읽음", e.message); }
    
//     return "디버깅 끝";
// };