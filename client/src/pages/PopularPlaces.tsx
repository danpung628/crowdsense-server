import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { rankingApi } from '../api/services';
import type { RankingItem } from '../api/types';

function PopularPlaces() {
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

  const fetchRankings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🏆 ${period} 인기 장소 랭킹 요청 중...`);
      
      const data = await rankingApi.getByPeriod(period, 20);
      console.log('✅ 랭킹 데이터 수신:', data);
      
      setRankings(data);
      setLoading(false);
    } catch (err) {
      const error = err as Error;
      console.error('❌ 랭킹 데이터 로딩 실패:', error);
      setError(error.message || '데이터를 불러올 수 없습니다.');
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const getRankMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}위`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500';
    if (rank === 2) return 'bg-gray-400';
    if (rank === 3) return 'bg-orange-600';
    return 'bg-blue-500';
  };

  const getPeriodLabel = (p: 'day' | 'week' | 'month') => {
    const labels = {
      day: '일간',
      week: '주간',
      month: '월간'
    };
    return labels[p];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">인기 장소 데이터를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">데이터를 불러올 수 없습니다</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchRankings}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">🏆 인기 장소 랭킹</h1>
          <p className="text-gray-600 mt-2">실시간 인파 데이터 기반 인기 장소 순위</p>
        </div>

        {/* 기간 선택 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                  period === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {getPeriodLabel(p)}
              </button>
            ))}
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">총 장소 수</div>
            <div className="text-2xl font-bold text-gray-800">{rankings.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">평균 방문자</div>
            <div className="text-2xl font-bold text-blue-600">
              {rankings.length > 0
                ? Math.round(rankings.reduce((sum, r) => sum + r.avgPopulation, 0) / rankings.length).toLocaleString()
                : 0}명
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">최고 방문자</div>
            <div className="text-2xl font-bold text-red-600">
              {rankings.length > 0 ? Math.max(...rankings.map(r => r.avgPopulation)).toLocaleString() : 0}명
            </div>
          </div>
        </div>

        {/* 랭킹 목록 */}
        {rankings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">랭킹 데이터가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rankings.map((place) => (
              <div 
                key={place.areaCode}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-center gap-4">
                  {/* 순위 배지 */}
                  <div 
                    className={`${getRankColor(place.rank)} text-white w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0`}
                  >
                    {place.rank <= 3 ? getRankMedal(place.rank) : place.rank}
                  </div>

                  {/* 장소 정보 */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{place.areaName}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span>👥</span>
                        <span>평균 방문: <strong className="text-blue-600">{place.avgPopulation.toLocaleString()}</strong>명</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>📊</span>
                        <span>총 방문: <strong className="text-green-600">{place.totalVisits.toLocaleString()}</strong>명</span>
                      </div>
                      {place.peakHour && (
                        <div className="flex items-center gap-1">
                          <span>⏰</span>
                          <span>피크타임: <strong className="text-orange-600">{place.peakHour}시</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 상세보기 버튼 */}
                  <Link
                    to={`/history/${place.areaCode}`}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition font-semibold flex-shrink-0"
                  >
                    상세보기
                  </Link>
                </div>

                {/* 진행바 */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((place.avgPopulation / Math.max(...rankings.map(r => r.avgPopulation))) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded mt-6">
          <p className="text-blue-800">
            💡 <strong>정보:</strong> 랭킹은 평균 방문자 수를 기준으로 산정되며, 실시간으로 업데이트됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PopularPlaces;

