import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { matchesAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const res = await matchesAPI.getMatches();
      setMatches(res.data);
    } catch (error) {
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading matches...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          Your Matches
        </h1>
        <p className="text-gray-600 text-center mb-8">You have {matches.length} matches</p>

        {matches.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-2xl font-bold mb-4">No matches yet</h2>
            <p className="text-gray-600 mb-6">Keep swiping to find your perfect match!</p>
            <Link to="/discover" className="btn-primary">
              Start Discovering
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <Link
                key={match.matchId}
                to={`/chat/${match.matchId}`}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all transform hover:scale-105"
              >
                <div className="h-64 bg-gradient-to-br from-pink-400 to-purple-600">
                  {match.user.photos && match.user.photos.length > 0 ? (
                    <img
                      src={`http://localhost:5000${match.user.photos[0]}`}
                      alt={match.user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white text-6xl">
                      👤
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    {match.user.name}, {match.user.age}
                  </h3>
                  {match.user.bio && (
                    <p className="text-gray-600 mt-2 line-clamp-2">{match.user.bio}</p>
                  )}
                  <div className="mt-4 text-center">
                    <span className="text-pink-500 font-semibold">Message →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Matches;