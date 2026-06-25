import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../redux/authSlice';
import api from '../services/api';

const roleBadgeClass = {
  client: 'badge-client',
  freelancer: 'badge-freelancer',
  admin: 'badge-admin',
};

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [skillInput, setSkillInput] = useState('');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    profileImage: user?.profileImage || '',
    bio: user?.bio || '',
    skills: user?.skills ? [...user.skills] : [],
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
    }
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.put('/users/profile', formData);
      dispatch(setUser(data.user));
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      profileImage: user?.profileImage || '',
      bio: user?.bio || '',
      skills: user?.skills ? [...user.skills] : [],
    });
    setError('');
    setIsEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-secondary"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </button>
        )}
      </div>

      {/* Feedback messages */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
          <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-start gap-2">
          <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* Profile card */}
      <div className="card">
        {/* Avatar + basic info */}
        <div className="flex items-start gap-5 pb-5 border-b border-gray-100 mb-5">
          <div className="relative shrink-0">
            {(isEditing ? formData.profileImage : user?.profileImage) ? (
              <img
                src={isEditing ? formData.profileImage : user?.profileImage}
                alt={user?.name}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-primary-50"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center ring-4 ring-primary-50">
                <span className="text-primary-700 font-bold text-2xl">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="form-label">Full Name</label>
                  <input
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Your full name"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="form-label">Profile Image URL</label>
                  <input
                    name="profileImage"
                    type="url"
                    value={formData.profileImage}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="https://example.com/avatar.jpg"
                    disabled={loading}
                  />
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-900">{user?.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
                <div className="mt-2">
                  <span className={roleBadgeClass[user?.role] || 'badge'}>
                    {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Email (read-only) */}
        {!isEditing && (
          <div className="grid grid-cols-2 gap-4 pb-5 border-b border-gray-100 mb-5 text-sm">
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">Email</p>
              <p className="text-gray-900">{user?.email}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">Member Since</p>
              <p className="text-gray-900">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : '—'
                }
              </p>
            </div>
          </div>
        )}

        {/* Bio */}
        <div className="mb-5">
          {isEditing ? (
            <div>
              <label className="form-label">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="form-input resize-none"
                placeholder="Tell clients about yourself..."
                disabled={loading}
              />
            </div>
          ) : (
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Bio</p>
              {user?.bio ? (
                <p className="text-gray-700 text-sm leading-relaxed">{user.bio}</p>
              ) : (
                <p className="text-gray-400 text-sm italic">No bio added yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Skills */}
        <div>
          {isEditing ? (
            <div>
              <label className="form-label">Skills</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  className="form-input flex-1"
                  placeholder="Type a skill and press Enter"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="btn-secondary px-3"
                  disabled={loading || !skillInput.trim()}
                >
                  Add
                </button>
              </div>
              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-primary-400 hover:text-primary-700 ml-0.5"
                        aria-label={`Remove ${skill}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Skills</p>
              {user?.skills && user.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm italic">No skills added yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Edit form actions */}
        {isEditing && (
          <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100">
            <button
              onClick={handleSubmit}
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
