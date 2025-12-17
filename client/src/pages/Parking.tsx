import { useEffect, useState } from 'react';
import { parkingApi } from '../api/services';
import type { ParkingLot } from '../api/types';

const SEOUL_DISTRICTS = [
  '전체', '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', 
  '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', 
  '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', 
  '용산구', '은평구', '종로구', '중구', '중랑구'
];

function Parking() {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [allParkingLots, setAllParkingLots] = useState<ParkingLot[]>([]); // 원본 데이터 저장
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('전체');
  
  // 가까운 주차장 찾기 관련 상태
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const [selectedRadius, setSelectedRadius] = useState(1);
  const [showNearbyResults, setShowNearbyResults] = useState(false);

  useEffect(() => {
    fetchParkingData();
  }, []);

  const fetchParkingData = async () => {
    try {
      setLoading(true);
      setError(null);
      setShowNearbyResults(false);
      console.log('🅿️ 주차장 데이터 요청 중...');
      
      const data = await parkingApi.getAll();
      console.log('✅ 주차장 데이터 수신:', data);
      
      setAllParkingLots(data); // 원본 데이터 저장
      setParkingLots(data);
      setLoading(false);
    } catch (err) {
      const error = err as Error;
      console.error('❌ 주차장 데이터 로딩 실패:', error);
      setError(error.message || '데이터를 불러올 수 없습니다.');
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      // 검색어가 비어있으면 원본 데이터로 복원
      setParkingLots(allParkingLots);
      return;
    }

    // 항상 원본 데이터(allParkingLots)에서 검색
    const filtered = allParkingLots.filter(lot =>
      lot.district.includes(searchQuery) ||
      lot.address.includes(searchQuery)
    );
    
    setParkingLots(filtered);
  };

  const handleDistrictChange = async (district: string) => {
    setSelectedDistrict(district);
    setShowNearbyResults(false);
    
    if (district === '전체') {
      fetchParkingData();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`🅿️ ${district} 주차장 데이터 요청 중...`);
      
      const data = await parkingApi.getByDistrict(district);
      console.log('✅ 구별 주차장 데이터 수신:', data);
      
      setAllParkingLots(data); // 구별 데이터도 원본으로 저장
      setParkingLots(data);
      setLoading(false);
    } catch (err) {
      const error = err as Error;
      console.error('❌ 구별 주차장 데이터 로딩 실패:', error);
      setError(error.message || '데이터를 불러올 수 없습니다.');
      setLoading(false);
    }
  };

  const handleFindNearby = async () => {
    if (!navigator.geolocation) {
      setNearbyError('이 브라우저는 위치 정보를 지원하지 않습니다.');
      return;
    }

    setNearbyLoading(true);
    setNearbyError(null);

    // 위치 정보 가져오기 헬퍼 함수
    const getLocation = (options: PositionOptions): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
    };

    try {
      let position: GeolocationPosition;
      
      // 1단계: 빠른 위치 정보 시도 (네트워크 기반, enableHighAccuracy: false)
      try {
        console.log('📍 빠른 위치 정보 시도 중...');
        position = await getLocation({
          enableHighAccuracy: false, // 네트워크 기반 위치 (빠름)
          timeout: 5000, // 5초 타임아웃
          maximumAge: 60000 // 1분 이내 캐시 사용
        });
        console.log('✅ 빠른 위치 정보 획득 성공');
      } catch (fastError) {
        // 2단계: 빠른 방법 실패 시 고정밀도 GPS 시도
        console.log('⚠️ 빠른 위치 정보 실패, 고정밀도 GPS 시도 중...');
        try {
          position = await getLocation({
            enableHighAccuracy: true, // GPS 사용 (느리지만 정확)
            timeout: 15000, // 15초 타임아웃
            maximumAge: 0 // 캐시 사용 안 함
          });
          console.log('✅ 고정밀도 GPS 위치 정보 획득 성공');
        } catch (gpsError) {
          // 두 방법 모두 실패
          const error = gpsError as GeolocationPositionError;
          let errorMessage = '위치 정보를 가져올 수 없습니다.';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '위치 정보를 사용할 수 없습니다.';
              break;
            case error.TIMEOUT:
              errorMessage = '위치 정보 요청 시간이 초과되었습니다. 인터넷 연결과 GPS 신호를 확인해주세요.';
              break;
          }
          
          setNearbyError(errorMessage);
          setNearbyLoading(false);
          return;
        }
      }

      // 위치 정보 획득 성공 - 주차장 검색 진행
      const { latitude, longitude } = position.coords;
      
      // 위치 정보 정규화 (소수점 6자리로 제한하여 일관성 확보)
      const normalizedLat = Math.round(latitude * 1000000) / 1000000;
      const normalizedLng = Math.round(longitude * 1000000) / 1000000;
      
      console.log(`📍 현재 위치: ${normalizedLat}, ${normalizedLng} (정규화됨)`);
      console.log(`🔍 반경 ${selectedRadius}km 내 주차장 검색 중...`);

      const data = await parkingApi.getNearby(
        normalizedLat,
        normalizedLng,
        selectedRadius // km 단위로 전달
      );
      
      // 거리 기준으로 정렬하여 일관성 확보 (거리가 있는 경우만)
      const sortedData = [...data].sort((a, b) => {
        const distA = a.distance ?? Infinity;
        const distB = b.distance ?? Infinity;
        return distA - distB;
      });
      
      console.log('✅ 근처 주차장 데이터 수신:', sortedData.length, '개');
      setAllParkingLots(sortedData); // 근처 주차장 데이터도 원본으로 저장
      setParkingLots(sortedData);
      setShowNearbyResults(true);
      setNearbyLoading(false);
    } catch (err) {
      const error = err as Error;
      console.error('❌ 근처 주차장 검색 실패:', error);
      setNearbyError(error.message || '주차장을 찾을 수 없습니다.');
      setNearbyLoading(false);
    }
  };

  const getAvailabilityColor = (available: number, total: number) => {
    if (total === 0) return 'text-gray-600 bg-gray-50';
    const ratio = available / total;
    if (ratio >= 0.5) return 'text-green-600 bg-green-50';
    if (ratio >= 0.2) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  // 운영시간 포맷팅 (이미 services.ts에서 포맷팅되지만, 혹시 모를 경우를 대비)
  const formatOperatingTimeString = (operatingTime: string): string => {
    if (!operatingTime) return '정보 없음';
    
    // 이미 콜론이 있으면 그대로 반환, 없으면 포맷팅
    if (operatingTime.includes(':')) {
      return operatingTime;
    }
    
    // "평일 0000-2400, 주말 0000-2400, 공휴일 0000-2400" 형식 처리
    return operatingTime
      .replace(/(\d{2})(\d{2})-(\d{2})(\d{2})/g, '$1:$2-$3:$4');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">주차장 데이터를 불러오는 중...</p>
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
              onClick={fetchParkingData}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  const validLots = parkingLots.filter(lot => lot.total > 0);
  const totalCapacity = validLots.reduce((sum, lot) => sum + lot.total, 0);
  const totalAvailable = validLots.reduce((sum, lot) => sum + lot.available, 0);
  const avgAvailability = validLots.length > 0
    ? Math.round((validLots.reduce((sum, lot) => sum + (lot.available / lot.total), 0) / validLots.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">🅿️ 실시간 주차장 정보</h1>
          <p className="text-gray-600 mt-2">서울시 공영주차장 실시간 현황</p>
        </div>

        {/* 검색 바 및 구 선택 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="주차장 주소 또는 구로 검색..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {SEOUL_DISTRICTS.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
            <button
              onClick={handleSearch}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition duration-200"
            >
              검색
            </button>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setParkingLots(allParkingLots); // 원본 데이터로 복원
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition duration-200"
              >
                초기화
              </button>
            )}
          </div>
        </div>

        {/* 가까운 주차장 찾기 섹션 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📍 내 위치에서 가까운 주차장 찾기</h2>
          
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 font-medium">반경:</label>
              <select
                value={selectedRadius}
                onChange={(e) => setSelectedRadius(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value={1}>1km</option>
                <option value={3}>3km</option>
                <option value={5}>5km</option>
              </select>
            </div>

            <button
              onClick={handleFindNearby}
              disabled={nearbyLoading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold px-6 py-2 rounded-lg transition duration-200 flex items-center gap-2"
            >
              {nearbyLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  검색 중...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  주변 주차장 찾기
                </>
              )}
            </button>

            {showNearbyResults && (
              <button
                onClick={fetchParkingData}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition duration-200"
              >
                전체 보기
              </button>
            )}
          </div>

          {nearbyError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{nearbyError}</p>
              </div>
            </div>
          )}

          {showNearbyResults && parkingLots.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                ✅ 반경 {selectedRadius}km 내 주차장 {parkingLots.length}개를 찾았습니다.
              </p>
            </div>
          )}
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">총 주차장</div>
            <div className="text-2xl font-bold text-gray-800">{parkingLots.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">총 주차면</div>
            <div className="text-2xl font-bold text-gray-800">
              {totalCapacity.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">가용 주차면</div>
            <div className="text-2xl font-bold text-green-600">
              {totalAvailable.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">평균 가용률</div>
            <div className="text-2xl font-bold text-blue-600">
              {avgAvailability}%
            </div>
          </div>
        </div>

        {/* 주차장 목록 */}
        {parkingLots.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parkingLots.map((lot, index) => (
              <div key={lot.parkingId || `parking-${index}`} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4">
                <div className="mb-3">
                  <h3 className="font-bold text-gray-800 text-lg">{lot.district}</h3>
                  <p className="text-sm text-gray-600">{lot.address}</p>
                </div>

                <div className="space-y-2">
                  {lot.total > 0 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">가용/전체</span>
                        <span className={`font-semibold px-3 py-1 rounded-full text-sm ${getAvailabilityColor(lot.available, lot.total)}`}>
                          {lot.available} / {lot.total}
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            lot.available / lot.total >= 0.5 ? 'bg-green-500' :
                            lot.available / lot.total >= 0.2 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(lot.available / lot.total) * 100}%` }}
                        ></div>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500">정보 없음</div>
                  )}

                  {lot.distance !== undefined && (
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span className="text-gray-600">거리:</span>
                      <span className="font-semibold text-blue-600">
                        {lot.distance < 1 
                          ? `${(lot.distance * 1000).toFixed(0)}m` 
                          : `${lot.distance.toFixed(2)}km`}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm pt-2">
                    <span className="text-gray-600">요금:</span>
                    <span className={`font-semibold ${lot.fee?.includes('무료') ? 'text-green-600' : 'text-orange-600'}`}>
                      {lot.fee || '정보 없음'}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 pt-1">
                    운영시간: {formatOperatingTimeString(lot.operatingTime || '')}
                  </div>
                  
                  {lot.updatedAt && (
                    <div className="text-xs text-gray-500">
                      업데이트: {new Date(lot.updatedAt).toLocaleString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Parking;
