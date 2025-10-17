const User = require('../models/User');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken 
} = require('../utils/jwtUtils');

class AuthService {
  // 회원가입
  async register(id, password) {
    try {
      // 기존 사용자 확인
      const existingUser = await User.findOne({ id });
      if (existingUser) {
        throw new Error('이미 존재하는 사용자 ID입니다.');
      }

      // 새 사용자 생성
      const user = new User({ id, password });
      await user.save();

      return {
        success: true,
        message: '회원가입이 완료되었습니다.',
        userId: user.id
      };
    } catch (error) {
      throw new Error(`회원가입 실패: ${error.message}`);
    }
  }

  // 로그인
  async login(id, password) {
    try {
      // 사용자 조회
      const user = await User.findOne({ id });
      if (!user) {
        throw new Error('존재하지 않는 사용자 ID입니다.');
      }

      // 비밀번호 확인
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('비밀번호가 일치하지 않습니다.');
      }

      // 토큰 생성
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      // 사용자 정보에 토큰 저장
      await user.updateTokens(accessToken, refreshToken);

      return {
        success: true,
        message: '로그인이 완료되었습니다.',
        accessToken,
        refreshToken,
        userId: user.id
      };
    } catch (error) {
      throw new Error(`로그인 실패: ${error.message}`);
    }
  }

  // 로그아웃
  async logout(userId) {
    try {
      const user = await User.findOne({ id: userId });
      if (user) {
        await user.clearTokens();
      }
      
      return {
        success: true,
        message: '로그아웃이 완료되었습니다.'
      };
    } catch (error) {
      throw new Error(`로그아웃 실패: ${error.message}`);
    }
  }

  // 토큰 갱신
  async refreshTokens(refreshToken) {
    try {
      // Refresh Token 검증
      const decoded = verifyRefreshToken(refreshToken);
      const userId = decoded.userId;

      // 사용자 조회 및 Refresh Token 확인
      const user = await User.findOne({ id: userId, refreshToken });
      if (!user) {
        throw new Error('유효하지 않은 refresh token입니다.');
      }

      // 새 토큰 생성
      const newAccessToken = generateAccessToken(userId);
      const newRefreshToken = generateRefreshToken(userId);

      // 사용자 정보에 새 토큰 저장
      await user.updateTokens(newAccessToken, newRefreshToken);

      return {
        success: true,
        message: '토큰이 갱신되었습니다.',
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        userId: user.id
      };
    } catch (error) {
      throw new Error(`토큰 갱신 실패: ${error.message}`);
    }
  }

  // 사용자 정보 조회
  async getUserInfo(userId) {
    try {
      const user = await User.findOne({ id: userId }).select('-password');
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      return {
        success: true,
        user: {
          id: user.id,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      };
    } catch (error) {
      throw new Error(`사용자 정보 조회 실패: ${error.message}`);
    }
  }
}

module.exports = new AuthService();
