import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { profilesAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    bio: '',
    interests: ''
  });
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user: authUser, logout } = useAuth();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await profilesAPI.getUser(authUser._id);
      setUser(res.data);
      setFormData({
        name: res.data.name || '',
        age: res.data.age || '',
        bio: res.data.bio || '',
        interests: res.data.interests?.join(', ') || ''
      });
      setPhotos(res.data.photos || []);
    } catch (error) {
      toast.error('Failed to load profile');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        age: parseInt(formData.age),
        interests: formData.interests.split(',').map(i => i.trim()).filter(i => i)
      };
      
      await profilesAPI.updateProfile(data);
      toast.success('Profile updated!');
      loadProfile();
    } catch (error) {
      toast.error('Failed to update profile');
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

  const handleDeletePhoto = async (photoUrl) => {
    try {
      await profilesAPI.deletePhoto(photoUrl);
      setPhotos(photos.filter(p => p !== photoUrl));
      toast.success('Photo deleted');
    } catch (error) {
      toast.error('Failed to delete photo');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-gray-600 text-center mb-8">Manage your profile settings</p>

          {/* User Info Card */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-6 mb-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/20 overflow-hidden">
                {photos.length > 0 ? (
                  <img
                    src={`http://localhost:5000${photos[0]}`}
                    alt={user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-4xl">👤</div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user?.name}</h2>
                <p className="text-white/90">{user?.email}</p>
                <span className="inline-block mt-2 bg-white/20 px-3 py-1 rounded-full text-sm">
                  {user?.subscription?.plan?.toUpperCase()} PLAN
                </span>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="input-field"
                min="18"
                max="100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="input-field"
                rows="4"
                maxLength="500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interests (comma separated)
              </label>
              <input
                type="text"
                name="interests"
                value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                className="input-field"
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
              <div className="grid grid-cols-3 gap-4">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={`http://localhost:5000${photo}`}
                      alt="Profile"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">You can upload up to 6 photos</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;