import { useEffect, useState } from 'react';
import { subwayApi } from '../api/services';
import type { SubwayStation } from '../api/types';

function Transit() {
  const [stations, setStations] = useState<SubwayStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchSubwayData();
  }, [retryCount]);

  const fetchSubwayData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🚇 지하철 데이터 요청 중...');
      
      const data = await subwayApi.getAll();
      console.log('✅ 지하철 데이터 수신:', data);
      
      setStations(data);
      setLoading(false);
    } catch (err) {
      const error = err as Error;
      console.error('❌ 지하철 데이터 로딩 실패:', error);
      setError(error.message || '데이터를 불러올 수 없습니다.');
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">지하철 데이터를 불러오는 중...</p>
              <p className="text-sm text-gray-400 mt-2">서울시 실시간 지하철 API 호출 중</p>
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
              onClick={handleRetry}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">🚇 지역별 지하철 현황</h1>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">지하철 데이터가 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">🚇 지역별 지하철 현황</h1>
          <p className="text-gray-600 mt-2">서울시 주요 지역별 지하철 승하차 인원 정보</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">모니터링 지역</div>
            <div className="text-2xl font-bold text-gray-800">{stations.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">총 역 수</div>
            <div className="text-2xl font-bold text-blue-600">
              {stations.reduce((sum, s) => sum + parseInt(s.subway.SUB_STN_CNT || '0'), 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">총 승차</div>
            <div className="text-2xl font-bold text-green-600">
              {stations.reduce((sum, s) => sum + parseInt(s.subway.SUB_ACML_GTON_PPLTN_MAX || '0'), 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">총 하차</div>
            <div className="text-2xl font-bold text-purple-600">
              {stations.reduce((sum, s) => sum + parseInt(s.subway.SUB_ACML_GTOFF_PPLTN_MAX || '0'), 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* 지역 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stations.map((station, index) => (
            <div key={station.areaCode || `station-${index}`} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4">
              <div className="mb-3">
                <h3 className="font-bold text-gray-800 text-lg">{station.areaInfo.areaName}</h3>
                <p className="text-xs text-gray-500">{station.areaInfo.engName}</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">역 수:</span>
                  <span className="font-semibold text-gray-800">{station.subway.SUB_STN_CNT}개</span>
                </div>
                
                {station.subway.SUB_ACML_GTON_PPLTN_MIN && station.subway.SUB_ACML_GTON_PPLTN_MAX ? (
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-xs text-gray-600 mb-1">승차 인원</div>
                    <div className="font-bold text-green-700">
                      {parseInt(station.subway.SUB_ACML_GTON_PPLTN_MIN).toLocaleString()}~
                      {parseInt(station.subway.SUB_ACML_GTON_PPLTN_MAX).toLocaleString()}명
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-xs text-gray-600 mb-1">승차 인원</div>
                    <div className="font-semibold text-gray-500">정보 없음</div>
                  </div>
                )}
                
                {station.subway.SUB_ACML_GTOFF_PPLTN_MIN && station.subway.SUB_ACML_GTOFF_PPLTN_MAX ? (
                  <div className="bg-purple-50 p-3 rounded">
                    <div className="text-xs text-gray-600 mb-1">하차 인원</div>
                    <div className="font-bold text-purple-700">
                      {parseInt(station.subway.SUB_ACML_GTOFF_PPLTN_MIN).toLocaleString()}~
                      {parseInt(station.subway.SUB_ACML_GTOFF_PPLTN_MAX).toLocaleString()}명
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-xs text-gray-600 mb-1">하차 인원</div>
                    <div className="font-semibold text-gray-500">정보 없음</div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 pt-2 border-t">
                  업데이트: {new Date(station.fetchedAt).toLocaleString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Transit;
