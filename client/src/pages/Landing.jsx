import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Landing = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center text-white mb-16">
          <h1 className="text-6xl font-bold mb-4">DateFi</h1>
          <p className="text-2xl mb-2">Connect. Match. Pay with Crypto.</p>
          <p className="text-lg opacity-90">The future of dating is decentralized</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
            <div className="text-5xl mb-4">💕</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Find Your Match</h3>
            <p className="text-gray-600">Swipe through profiles and connect with like-minded people</p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Secure & Private</h3>
            <p className="text-gray-600">Your data is protected with blockchain-level security</p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
            <div className="text-5xl mb-4">💰</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Crypto Payments</h3>
            <p className="text-gray-600">Pay for premium features with USDT, BTC, ETH and more</p>
          </div>
        </div>

        <div className="text-center">
          {isAuthenticated ? (
            <Link to="/discover" className="btn-primary text-lg inline-block">
              Start Matching
            </Link>
          ) : (
            <div className="space-x-4">
              <Link to="/login" className="btn-primary text-lg inline-block">
                Login
              </Link>
              <Link to="/register" className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all inline-block">
                Get Started
              </Link>
            </div>
          )}
        </div>

        <div className="mt-20 text-center text-white opacity-75">
          <p>© 2024 DateFi. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;