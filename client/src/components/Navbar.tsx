import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/", label: "홈", icon: "🏠" },
    { path: "/crowd", label: "인파", icon: "👥" },
    { path: "/transit", label: "교통", icon: "🚇" },
    { path: "/parking", label: "주차", icon: "🅿️" },
    { path: "/popular", label: "인기장소", icon: "🏆" },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link to="/" className="text-xl font-bold hover:text-blue-200">
            CrowdSense
          </Link>

          {/* 메뉴 및 인증 */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* 네비게이션 메뉴 */}
            <div className="flex gap-2 md:gap-4 overflow-x-auto">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 rounded transition relative ${
                    isActive(item.path)
                      ? "bg-blue-700 font-semibold"
                      : "hover:bg-blue-500"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              ))}
            </div>

            {/* 인증 버튼 */}
            <div className="flex items-center gap-2 ml-2 md:ml-4">
              {isAuthenticated ? (
                <>
                  <span className="hidden md:inline text-sm">
                    {user?.id}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 text-sm rounded hover:bg-blue-500 transition"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3 py-2 text-sm rounded hover:bg-blue-500 transition"
                  >
                    로그인
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-2 text-sm rounded bg-blue-700 hover:bg-blue-800 transition"
                  >
                    회원가입
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
