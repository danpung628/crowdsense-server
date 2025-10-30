import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import CrowdMap from "./pages/CrowdMap";
import CrowdDetail from "./pages/CrowdDetail";
import Transit from "./pages/Transit";
import Parking from "./pages/Parking";
import PopularPlaces from "./pages/PopularPlaces";
import HistoryView from "./pages/HistoryView";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/crowd" element={<CrowdMap />} />
          <Route path="/crowd/:areaCode" element={<CrowdDetail />} />
          <Route path="/transit" element={<Transit />} />
          <Route path="/parking" element={<Parking />} />
          <Route path="/popular" element={<PopularPlaces />} />
          <Route path="/history/:areaCode" element={<HistoryView />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
