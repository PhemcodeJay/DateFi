import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isDemo = user?.email === 'demo@datefi.com';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      {isDemo && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-center py-1 text-sm font-medium">
          🚀 Demo Mode — Explore all features! <Link to="/register" className="underline hover:text-white/80 ml-2">Create real account →</Link>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/discover" className="flex items-center space-x-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              DateFi
            </div>
            {isDemo && <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">DEMO</span>}
          </Link>

          <div className="flex items-center space-x-6">
            <Link to="/discover" className="text-gray-700 hover:text-pink-500 transition-colors font-medium">
              Discover
            </Link>
            <Link to="/matches" className="text-gray-700 hover:text-pink-500 transition-colors font-medium">
              Matches
            </Link>
            <Link to="/subscription" className="text-gray-700 hover:text-pink-500 transition-colors font-medium">
              Subscription
            </Link>
            <Link to="/profile" className="text-gray-700 hover:text-pink-500 transition-colors font-medium">
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="btn-secondary text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;