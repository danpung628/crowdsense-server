import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { crowdApi } from '../api/services';

interface HistoryData {
  timestamp: string;
  population: number;
  level: string;
}

interface AreaInfo {
  areaName: string;
  engName?: string;
  category: string;
}

function HistoryView() {
  const { areaCode } = useParams<{ areaCode: string }>();
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  const [areaInfo, setAreaInfo] = useState<AreaInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHistoryData = useCallback(async () => {
    try {
      setLoading(true);
      // API에서 히스토리 데이터 가져오기
      const response = await crowdApi.getHistory(areaCode!, 24);
      
      console.log('📊 히스토리 응답:', response);
      
      // 데이터 포맷팅
      const formattedData = response.timeseries.map((item) => ({
        timestamp: new Date(item.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        population: item.peopleCount,
        level: getCongestionLevelName(item.congestionLevel),
      }));

      setHistoryData(formattedData);
      setAreaInfo({
        areaName: response.areaName,
        category: '',
      });
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  }, [areaCode]);

  // 혼잡도 레벨을 이름으로 변환
  const getCongestionLevelName = (level: number): string => {
    if (level >= 5) return '매우 혼잡';
    if (level >= 4) return '혼잡';
    if (level >= 3) return '보통';
    if (level >= 2) return '여유';
    return '한산';
  };

  useEffect(() => {
    if (areaCode) {
      fetchHistoryData();
    }
  }, [areaCode, fetchHistoryData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <Link to="/crowd" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
            ← 목록으로
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">{areaInfo?.areaName || '지역 정보'}</h1>
          <p className="text-gray-600 mt-2">24시간 인파 변화 추이</p>
        </div>

        {/* 그래프 카드 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">인파 변화 추이</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                label={{ value: '인구수', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toLocaleString()}명`, '예상 인구']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="population" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="예상 인구"
                dot={{ fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm text-gray-600 mb-2">평균 인구</h3>
            <p className="text-3xl font-bold text-blue-600">
              {Math.round(historyData.reduce((sum, item) => sum + item.population, 0) / historyData.length).toLocaleString()}명
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm text-gray-600 mb-2">최대 인구</h3>
            <p className="text-3xl font-bold text-red-600">
              {Math.max(...historyData.map(item => item.population)).toLocaleString()}명
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm text-gray-600 mb-2">최소 인구</h3>
            <p className="text-3xl font-bold text-green-600">
              {Math.min(...historyData.map(item => item.population)).toLocaleString()}명
            </p>
          </div>
        </div>

        {/* 히스토리 테이블 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">상세 기록</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">시간</th>
                  <th className="px-4 py-2 text-left">혼잡도</th>
                  <th className="px-4 py-2 text-right">예상 인구</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-2">{item.timestamp}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.level === '여유' ? 'bg-green-100 text-green-800' :
                        item.level === '보통' ? 'bg-yellow-100 text-yellow-800' :
                        item.level.includes('붐빔') ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.level}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">{item.population.toLocaleString()}명</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistoryView;
