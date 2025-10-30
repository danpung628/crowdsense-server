import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { crowdApi, areaApi } from '../api/services';
import type { CrowdData, AreaInfo, CrowdHistoryResponse } from '../api/types';

function CrowdDetail() {
  const { areaCode } = useParams<{ areaCode: string }>();
  const navigate = useNavigate();
  const [areaInfo, setAreaInfo] = useState<AreaInfo | null>(null);
  const [currentCrowd, setCurrentCrowd] = useState<CrowdData | null>(null);
  const [history, setHistory] = useState<CrowdHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyHours, setHistoryHours] = useState(24);

  const fetchDetailData = React.useCallback(async (code: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`📍 지역 ${code} 상세 정보 로딩 중...`);

      // 병렬로 데이터 가져오기
      const [areaData, crowdData, historyData] = await Promise.all([
        areaApi.getByCode(code),
        crowdApi.getByAreaCode(code),
        crowdApi.getHistory(code, historyHours)
      ]);

      console.log('✅ 지역 정보:', areaData);
      console.log('✅ 현재 인파:', crowdData);
      console.log('✅ 히스토리:', historyData);

      setAreaInfo(areaData);
      setCurrentCrowd(crowdData);
      setHistory(historyData);
      setLoading(false);
    } catch (err) {
      const error = err as Error;
      console.error('❌ 상세 데이터 로딩 실패:', error);
      setError(error.message || '데이터를 불러올 수 없습니다.');
      setLoading(false);
    }
  }, [historyHours]);

  useEffect(() => {
    if (areaCode) {
      fetchDetailData(areaCode);
    }
  }, [areaCode, fetchDetailData]);

  const getCongestionLevel = (data: Record<string, unknown>) => {
    const cityDataArray = data?.['SeoulRtd.citydata_ppltn'] as Array<Record<string, string>> | undefined;
    const cityData = cityDataArray?.[0];
    return cityData?.AREA_CONGEST_LVL || 'unknown';
  };

  const getCongestionMessage = (data: Record<string, unknown>) => {
    const cityDataArray = data?.['SeoulRtd.citydata_ppltn'] as Array<Record<string, string>> | undefined;
    const cityData = cityDataArray?.[0];
    return cityData?.AREA_CONGEST_MSG || '정보 없음';
  };

  const getCongestionColor = (level: string) => {
    const colors: { [key: string]: string } = {
      '한산': 'bg-blue-400',
      '여유': 'bg-green-500',
      '보통': 'bg-yellow-500',
      '혼잡': 'bg-orange-500',
      '매우 혼잡': 'bg-red-500',
      // 기존 레벨도 지원 (호환성)
      '약간 붐빔': 'bg-orange-400',
      '붐빔': 'bg-orange-600',
      '매우 붐빔': 'bg-red-500',
    };
    return colors[level] || 'bg-gray-500';
  };

  const getCongestionBadgeColor = (level: string) => {
    const colors: { [key: string]: string } = {
      '여유': 'bg-green-100 text-green-800 border-green-300',
      '보통': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      '약간 붐빔': 'bg-orange-100 text-orange-800 border-orange-300',
      '붐빔': 'bg-orange-200 text-orange-900 border-orange-400',
      '매우 붐빔': 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[level] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getCongestionLevelName = (levelNum: number): string => {
    if (levelNum >= 5) return '매우 혼잡';
    if (levelNum >= 4) return '혼잡';
    if (levelNum >= 3) return '보통';
    if (levelNum >= 2) return '여유';
    return '한산';
  };

  const getPopulationData = (data: Record<string, unknown>) => {
    const cityDataArray = data?.['SeoulRtd.citydata_ppltn'] as Array<Record<string, string>> | undefined;
    const cityData = cityDataArray?.[0];
    return {
      min: parseInt(cityData?.AREA_PPLTN_MIN || '0'),
      max: parseInt(cityData?.AREA_PPLTN_MAX || '0'),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">상세 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !areaInfo || !currentCrowd) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">데이터를 불러올 수 없습니다</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => areaCode && fetchDetailData(areaCode)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg"
              >
                다시 시도
              </button>
              <button
                onClick={() => navigate('/crowd')}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg"
              >
                목록으로
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const level = getCongestionLevel(currentCrowd.data);
  const message = getCongestionMessage(currentCrowd.data);
  const population = getPopulationData(currentCrowd.data);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 뒤로가기 버튼 */}
        <div className="mb-6">
          <Link
            to="/crowd"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>목록으로 돌아가기</span>
          </Link>
        </div>

        {/* 지역 정보 헤더 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-800">{areaInfo.areaName}</h1>
                <span className={`${getCongestionBadgeColor(level)} text-sm font-semibold px-4 py-1.5 rounded-full border-2`}>
                  {level}
                </span>
              </div>
              {areaInfo.engName && (
                <p className="text-gray-500 mb-3">{areaInfo.engName}</p>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                {areaInfo.category && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {areaInfo.category}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  지역코드: {areaInfo.areaCode}
                </span>
              </div>
              <p className="text-gray-700 text-lg">{message}</p>
            </div>
          </div>
        </div>

        {/* 현재 인파 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-600">최소 인구</div>
                <div className="text-2xl font-bold text-gray-800">{population.min.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-600">최대 인구</div>
                <div className="text-2xl font-bold text-gray-800">{population.max.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-600">평균 인구</div>
                <div className="text-2xl font-bold text-gray-800">
                  {Math.floor((population.min + population.max) / 2).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 혼잡도 바 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">혼잡도</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>여유</span>
              <span>보통</span>
              <span>약간 붐빔</span>
              <span>붐빔</span>
              <span>매우 붐빔</span>
            </div>
            <div className="w-full bg-gradient-to-r from-green-200 via-yellow-200 via-orange-200 to-red-200 rounded-full h-4 relative">
              <div 
                className={`${getCongestionColor(level)} h-4 rounded-full absolute transition-all duration-300`}
                style={{ 
                  width: level === '여유' ? '20%' : 
                         level === '보통' ? '40%' : 
                         level === '약간 붐빔' ? '60%' : 
                         level === '붐빔' ? '80%' : '100%',
                  boxShadow: '0 0 10px rgba(0,0,0,0.3)'
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* 히스토리 섹션 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">📊 인파 히스토리</h2>
            <select
              value={historyHours}
              onChange={(e) => setHistoryHours(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value={6}>최근 6시간</option>
              <option value={12}>최근 12시간</option>
              <option value={24}>최근 24시간</option>
              <option value={48}>최근 48시간</option>
            </select>
          </div>

          {history && history.timeseries.length > 0 ? (
            <div className="space-y-2">
              {history.timeseries.slice().reverse().map((item, index) => {
                const itemLevel = getCongestionLevelName(item.congestionLevel);
                
                return (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="text-xs text-gray-500 w-32">
                      {new Date(item.timestamp).toLocaleString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-6 relative">
                        <div 
                          className={`${getCongestionColor(itemLevel)} h-6 rounded-full transition-all duration-300 flex items-center justify-start px-2`}
                          style={{ 
                            width: itemLevel === '한산' ? '20%' : 
                                   itemLevel === '여유' ? '35%' : 
                                   itemLevel === '보통' ? '50%' : 
                                   itemLevel === '혼잡' ? '70%' : 
                                   itemLevel === '매우 혼잡' ? '100%' : '50%'
                          }}
                        >
                          <span className="text-xs font-semibold text-white drop-shadow">{itemLevel}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-700 w-28 text-right">
                      {item.peopleCount.toLocaleString()}명
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              히스토리 데이터가 없습니다.
            </div>
          )}
        </div>

        {/* 업데이트 시간 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          마지막 업데이트: {new Date(currentCrowd.fetchedAt).toLocaleString('ko-KR')}
        </div>
      </div>
    </div>
  );
}

export default CrowdDetail;

