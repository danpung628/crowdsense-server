import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import { lazy, Suspense } from "react";

// 코드 스플리팅을 위한 lazy loading
const Home = lazy(() => import("./pages/Home"));
const CrowdMap = lazy(() => import("./pages/CrowdMap"));
const CrowdDetail = lazy(() => import("./pages/CrowdDetail"));
const Transit = lazy(() => import("./pages/Transit"));
const Parking = lazy(() => import("./pages/Parking"));
const PopularPlaces = lazy(() => import("./pages/PopularPlaces"));
const HistoryView = lazy(() => import("./pages/HistoryView"));

// 로딩 컴포넌트
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">페이지를 불러오는 중...</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/crowd" element={<CrowdMap />} />
            <Route path="/crowd/:areaCode" element={<CrowdDetail />} />
            <Route path="/transit" element={<Transit />} />
            <Route path="/parking" element={<Parking />} />
            <Route path="/popular" element={<PopularPlaces />} />
            <Route path="/history/:areaCode" element={<HistoryView />} />
          </Routes>
        </Suspense>
      </main>
    </BrowserRouter>
  );
}

export default App;
