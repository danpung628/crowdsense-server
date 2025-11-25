const mongoose = require('mongoose');

/**
 * 인구 밀집도 히스토리 스키마
 * - 10분마다 저장
 * - 30일 후 자동 삭제 (TTL 인덱스)
 */
const crowdHistorySchema = new mongoose.Schema({
  areaCode: {
    type: String,
    required: true,
    index: true
  },
  areaName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  // 인구 수 (API 응답에서 추출)
  peopleCount: {
    type: Number,
    default: 0
  },
  // 혼잡도 레벨 (1-5)
  congestionLevel: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  // 원본 API 데이터 (선택적 저장)
  rawData: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  // 데이터 수집 시간
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
    // TTL 인덱스: 30일 후 자동 삭제
    expires: 30 * 24 * 60 * 60
  }
}, {
  timestamps: false // timestamp 필드를 직접 관리하므로 비활성화
});

// 복합 인덱스: 지역별 시계열 조회 최적화
crowdHistorySchema.index({ areaCode: 1, timestamp: -1 });

// 카테고리별 랭킹 조회 최적화
crowdHistorySchema.index({ category: 1, peopleCount: -1, timestamp: -1 });

module.exports = mongoose.model('CrowdHistory', crowdHistorySchema);

