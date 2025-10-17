const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  accessToken: {
    type: String,
    default: null
  },
  refreshToken: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// 비밀번호 해싱 미들웨어
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 비밀번호 비교 메서드
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 토큰 업데이트 메서드
userSchema.methods.updateTokens = function(accessToken, refreshToken) {
  this.accessToken = accessToken;
  this.refreshToken = refreshToken;
  return this.save();
};

// 토큰 초기화 메서드
userSchema.methods.clearTokens = function() {
  this.accessToken = null;
  this.refreshToken = null;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
