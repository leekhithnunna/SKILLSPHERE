import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateGig } from '../redux/gigSlice';
import gigService from '../services/gigService';

const EditGigPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budgetMin: '',
    budgetMax: '',
    deadline: '',
    skillsRequired: [],
    status: 'open',
  });
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');

  const [milestones, setMilestones] = useState([]);
  const [milestoneForm, setMilestoneForm] = useState({ title: '', amount: '', dueDate: '' });

  const addMilestone = () => {
    if (!milestoneForm.title.trim() || !milestoneForm.amount) return;
    setMilestones((prev) => [...prev, { ...milestoneForm, amount: Number(milestoneForm.amount) }]);
    setMilestoneForm({ title: '', amount: '', dueDate: '' });
  };

  const removeMilestone = (idx) => {
    setMilestones((prev) => prev.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    const fetchGig = async () => {
      try {
        const { data } = await gigService.getGigById(id);
        const gig = data.data;
        setFormData({
          title: gig.title || '',
          description: gig.description || '',
          budgetMin: gig.budgetMin || '',
          budgetMax: gig.budgetMax || '',
          deadline: gig.deadline ? gig.deadline.split('T')[0] : '',
          skillsRequired: gig.skillsRequired || [],
          status: gig.status || 'open',
        });
        setMilestones(
          (gig.milestones || []).map((m) => ({
            ...m,
            dueDate: m.dueDate ? m.dueDate.split('T')[0] : '',
          }))
        );
      } catch {
        setError('Failed to load gig details.');
      } finally {
        setFetchLoading(false);
      }
    };
    fetchGig();
  }, [id]);

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
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        budgetMin: Number(formData.budgetMin),
        budgetMax: Number(formData.budgetMax),
        deadline: formData.deadline || undefined,
        milestones,
      };
      const { data } = await gigService.updateGig(id, payload);
      dispatch(updateGig(data.data));
      navigate('/my-gigs');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update gig.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex justify-center py-24">
        <svg className="animate-spin w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Edit Gig</h1>
        <p className="text-sm text-gray-500 mt-0.5">Update your gig details</p>
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
            required
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Min Budget ($) *</label>
            <input
              name="budgetMin"
              type="number"
              value={formData.budgetMin}
              onChange={handleChange}
              className="form-input"
              min="1"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="form-label">Max Budget ($) *</label>
            <input
              name="budgetMax"
              type="number"
              value={formData.budgetMax}
              onChange={handleChange}
              className="form-input"
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
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="form-label">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="form-input"
            disabled={loading}
          >
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </select>
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

        <div>
          <label className="form-label">Milestones</label>
          {milestones.length > 0 && (
            <div className="space-y-2 mb-3">
              {milestones.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-gray-50 text-sm">
                  <span className="flex-1">
                    {m.title} — <span className="font-medium text-primary-600">${m.amount}</span>
                    {m.dueDate && <span className="text-gray-400"> · due {m.dueDate}</span>}
                    {m.status && <span className="text-gray-400"> · {m.status}</span>}
                  </span>
                  <button type="button" onClick={() => removeMilestone(idx)} className="text-red-400 hover:text-red-600 text-xs shrink-0">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <input
              placeholder="Milestone title"
              value={milestoneForm.title}
              onChange={(e) => setMilestoneForm((p) => ({ ...p, title: e.target.value }))}
              className="form-input"
              disabled={loading}
            />
            <input
              type="number"
              min="1"
              placeholder="Amount ($)"
              value={milestoneForm.amount}
              onChange={(e) => setMilestoneForm((p) => ({ ...p, amount: e.target.value }))}
              className="form-input"
              disabled={loading}
            />
            <input
              type="date"
              value={milestoneForm.dueDate}
              onChange={(e) => setMilestoneForm((p) => ({ ...p, dueDate: e.target.value }))}
              className="form-input"
              disabled={loading}
            />
          </div>
          <button
            type="button"
            onClick={addMilestone}
            className="btn-secondary mt-2"
            disabled={loading || !milestoneForm.title.trim() || !milestoneForm.amount}
          >
            + Add Milestone
          </button>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={loading}>
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

export default EditGigPage;
