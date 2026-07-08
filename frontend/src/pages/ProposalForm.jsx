import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addProposal } from '../redux/proposalSlice';
import proposalService from '../services/proposalService';

const ProposalForm = ({ gigId, onSuccess }) => {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    coverLetter: '',
    bidAmount: '',
    estimatedDays: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.coverLetter || !formData.bidAmount || !formData.estimatedDays) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        gigId,
        coverLetter: formData.coverLetter,
        bidAmount: Number(formData.bidAmount),
        estimatedDays: Number(formData.estimatedDays),
      };
      const { data } = await proposalService.createProposal(payload);
      dispatch(addProposal(data.data));
      setSuccess('Proposal submitted successfully!');
      setTimeout(() => {
        onSuccess?.();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit proposal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border-primary-100">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Submit Your Proposal</h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="form-label">Cover Letter *</label>
          <textarea
            name="coverLetter"
            value={formData.coverLetter}
            onChange={handleChange}
            rows={5}
            className="form-input resize-none"
            placeholder="Tell the client why you're the right fit for this project..."
            required
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Bid Amount ($) *</label>
            <input
              name="bidAmount"
              type="number"
              value={formData.bidAmount}
              onChange={handleChange}
              className="form-input"
              placeholder="350"
              min="1"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="form-label">Estimated Days *</label>
            <input
              name="estimatedDays"
              type="number"
              value={formData.estimatedDays}
              onChange={handleChange}
              className="form-input"
              placeholder="14"
              min="1"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Proposal'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProposalForm;
