import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addGig } from '../redux/gigSlice';
import gigService from '../services/gigService';

const CreateGigPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: '',
    skillsRequired: [],
  });
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !formData.skillsRequired.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        skillsRequired: [...prev.skillsRequired, trimmed],
      }));
    }
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setFormData((prev) => ({
      ...prev,
      skillsRequired: prev.skillsRequired.filter((s) => s !== skill),
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
    if (!formData.title || !formData.description || !formData.budget) {
      setError('Title, description, and budget are required.');
      return;
    }
    if (Number(formData.budget) < 1) {
      setError('Budget must be at least $1.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        budget: Number(formData.budget),
        deadline: formData.deadline || undefined,
      };
      const { data } = await gigService.createGig(payload);
      dispatch(addGig(data.data));
      navigate('/my-gigs');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create gig. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Post a New Gig</h1>
        <p className="text-sm text-gray-500 mt-0.5">Fill in the details to attract top freelancers</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="form-label">Title *</label>
          <input
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g. Build a React e-commerce site"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="form-label">Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            className="form-input resize-none"
            placeholder="Describe the project, requirements, and deliverables..."
            required
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Budget ($) *</label>
            <input
              name="budget"
              type="number"
              value={formData.budget}
              onChange={handleChange}
              className="form-input"
              placeholder="500"
              min="1"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="form-label">Deadline</label>
            <input
              name="deadline"
              type="date"
              value={formData.deadline}
              onChange={handleChange}
              className="form-input"
              min={new Date().toISOString().split('T')[0]}
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="form-label">Skills Required</label>
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
          {formData.skillsRequired.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.skillsRequired.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-primary-400 hover:text-primary-700"
                    aria-label={`Remove ${skill}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Posting...
              </span>
            ) : (
              'Post Gig'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/my-gigs')}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGigPage;
