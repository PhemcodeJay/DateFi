import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { profilesAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const ProfileSetup = () => {
  const [formData, setFormData] = useState({
    bio: '',
    interests: [],
    preferences: {
      ageMin: 18,
      ageMax: 100,
      maxDistance: 50,
      gender: ['male', 'female', 'other']
    }
  });
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await profilesAPI.updateProfile(formData);
      toast.success('Profile created!');
      navigate('/discover');
    } catch (error) {
      toast.error('Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await profilesAPI.uploadPhoto(formData);
      setPhotos(res.data.photos);
      toast.success('Photo uploaded!');
    } catch (error) {
      toast.error('Failed to upload photo');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            Complete Your Profile
          </h1>
          <p className="text-gray-600 text-center mb-8">Add some details to get started</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="input-field"
                rows="4"
                placeholder="Tell us about yourself..."
                maxLength="500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interests (comma separated)
              </label>
              <input
                type="text"
                onChange={(e) => setFormData({
                  ...formData,
                  interests: e.target.value.split(',').map(i => i.trim()).filter(i => i)
                })}
                className="input-field"
                placeholder="hiking, movies, cooking, travel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Photos
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="mb-4"
              />
              <div className="flex flex-wrap gap-4">
                {photos.map((photo, idx) => (
                  <img key={idx} src={photo} alt="Profile" className="w-24 h-24 object-cover rounded-lg" />
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">You can upload up to 6 photos</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;