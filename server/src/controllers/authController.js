const authService = require('../services/authService');
const { verifyAccessToken } = require('../utils/jwtUtils');

// 회원가입
exports.register = async (req, res) => {
  try {
    const { id, password } = req.body;

    // 입력값 검증
    if (!id || !password) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID와 비밀번호를 모두 입력해주세요.'
      });
    }

    if (id.length < 3 || id.length > 50) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID는 3-50자 사이여야 합니다.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: '비밀번호는 최소 6자 이상이어야 합니다.'
      });
    }

    const result = await authService.register(id, password);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 로그인
exports.login = async (req, res) => {
  try {
    const { id, password } = req.body;

    // 입력값 검증
    if (!id || !password) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID와 비밀번호를 모두 입력해주세요.'
      });
    }

    const result = await authService.login(id, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
};

// 로그아웃
exports.logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '인증 토큰이 필요합니다.'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    const userId = decoded.userId;

    const result = await authService.logout(userId);
    res.json(result);
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
};

// 토큰 갱신
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token이 필요합니다.'
      });
    }

    const result = await authService.refreshTokens(refreshToken);
    res.json(result);
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
};

// 사용자 정보 조회
exports.getUserInfo = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '인증 토큰이 필요합니다.'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    const userId = decoded.userId;

    const result = await authService.getUserInfo(userId);
    res.json(result);
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
};

// 인증 미들웨어
exports.authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '인증 토큰이 필요합니다.'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    req.user = { userId: decoded.userId };
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
};
