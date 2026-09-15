import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { profilesAPI, matchesAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const Discover = () => {
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const res = await profilesAPI.discover();
      setProfiles(res.data);
    } catch (error) {
      toast.error('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (currentIndex >= profiles.length || actionLoading) return;
    setActionLoading(true);

    const profile = profiles[currentIndex];
    try {
      const res = await matchesAPI.like(profile.id);
      if (res.data.match) {
        toast.success(`You matched with ${profile.name}! 🎉`, { duration: 4000 });
      }
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to like');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePass = async () => {
    if (currentIndex >= profiles.length || actionLoading) return;
    setActionLoading(true);

    const profile = profiles[currentIndex];
    try {
      await matchesAPI.pass(profile.id);
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      toast.error('Failed to pass');
    } finally {
      setActionLoading(false);
    }
  };

  const currentProfile = profiles[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          <p className="text-gray-600">Finding people near you...</p>
        </div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💫</div>
          <h2 className="text-3xl font-bold mb-4">No more profiles</h2>
          <p className="text-gray-600 mb-6">Check back later for more matches!</p>
          <button onClick={loadProfiles} className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all">
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-md">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="relative h-96 bg-gradient-to-br from-pink-400 to-purple-600">
            {currentProfile.photos && currentProfile.photos.length > 0 ? (
              <img
                src={`/api${currentProfile.photos[0]}`}
                alt={currentProfile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white text-6xl">👤</div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <h2 className="text-3xl font-bold text-white">{currentProfile.name}, {currentProfile.age}</h2>
              {currentProfile.bio && <p className="text-white/90 mt-2 line-clamp-2">{currentProfile.bio}</p>}
            </div>
          </div>

          <div className="p-6">
            {currentProfile.interests && currentProfile.interests.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {currentProfile.interests.slice(0, 5).map((interest, idx) => (
                    <span key={idx} className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm">{interest}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center gap-6 mt-8">
              <button onClick={handlePass} disabled={actionLoading}
                className="w-16 h-16 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-3xl transition-all transform hover:scale-110 shadow-lg disabled:opacity-50">
                ✕
              </button>
              <button onClick={handleLike} disabled={actionLoading}
                className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-full flex items-center justify-center text-3xl text-white transition-all transform hover:scale-110 shadow-lg disabled:opacity-50">
                ♥
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-gray-600">{currentIndex} / {profiles.length}</div>
      </div>
    </div>
  );
};

export default Discover;