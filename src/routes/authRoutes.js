const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register - 회원가입
router.post('/register', authController.register);

// POST /api/auth/login - 로그인
router.post('/login', authController.login);

// POST /api/auth/logout - 로그아웃 (인증 필요)
router.post('/logout', authController.logout);

// POST /api/auth/refresh - 토큰 갱신
router.post('/refresh', authController.refresh);

// GET /api/auth/me - 사용자 정보 조회 (인증 필요)
router.get('/me', authController.getUserInfo);

// 인증이 필요한 라우트들을 위한 미들웨어 예시
// router.get('/protected', authController.authenticate, (req, res) => {
//   res.json({ 
//     success: true, 
//     message: '인증된 사용자만 접근 가능한 데이터',
//     userId: req.user.userId 
//   });
// });

module.exports = router;
