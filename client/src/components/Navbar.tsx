import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/", label: "홈", icon: "🏠" },
    { path: "/crowd", label: "인파", icon: "👥" },
    { path: "/transit", label: "교통", icon: "🚇" },
    { path: "/parking", label: "주차", icon: "🅿️" },
    { path: "/popular", label: "인기장소", icon: "🏆" },
  ];

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link to="/" className="text-xl font-bold hover:text-blue-200">
            CrowdSense
          </Link>

          {/* 메뉴 */}
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
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
