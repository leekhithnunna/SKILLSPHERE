import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import disputeService from '../services/disputeService';
import adminService from '../services/adminService';
import resolveFileUrl from '../utils/resolveFileUrl';

const statusBadge = {
  open: 'bg-yellow-100 text-yellow-700',
  under_review: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
};

const DisputeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchDispute = async () => {
    try {
      const { data } = await disputeService.getDisputeById(id);
      setDispute(data.data);
    } catch {
      setError('Dispute not found or you are not authorized to view it.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await disputeService.addEvidence(id, formData);
      setDispute(data.data);
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleResolve = async (status) => {
    setResolving(true);
    try {
      await adminService.resolveDispute(id, status, resolution);
      await fetchDispute();
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <svg className="animate-spin w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="card text-center py-16">
        <p className="text-gray-500 mb-4">{error}</p>
        <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
      </div>
    );
  }

  const isParticipant = dispute.raisedBy._id === user._id || dispute.against._id === user._id;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="card">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{dispute.reason}</h1>
            <p className="text-sm text-gray-500 mt-0.5">On "{dispute.gig?.title}"</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${statusBadge[dispute.status]}`}>
            {dispute.status.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Raised by</p>
            <p className="text-gray-900">{dispute.raisedBy?.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Against</p>
            <p className="text-gray-900">{dispute.against?.name}</p>
          </div>
        </div>

        {dispute.description && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{dispute.description}</p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Evidence</p>
          {dispute.evidence?.length > 0 ? (
            <div className="space-y-1.5">
              {dispute.evidence.map((e, idx) => (
                <a key={idx} href={resolveFileUrl(e.url)} target="_blank" rel="noreferrer" className="block text-sm text-primary-600 hover:underline">
                  📎 {e.name}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No evidence uploaded yet.</p>
          )}

          {isParticipant && ['open', 'under_review'].includes(dispute.status) && (
            <form onSubmit={handleUploadEvidence} className="flex gap-2 mt-3">
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm flex-1" />
              <button type="submit" disabled={uploading || !file} className="btn-secondary shrink-0 text-xs">
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </form>
          )}
        </div>

        {dispute.status === 'resolved' || dispute.status === 'rejected' ? (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Resolution</p>
            <p className="text-sm text-gray-700">{dispute.resolution || 'No notes provided.'}</p>
            <p className="text-xs text-gray-400 mt-1">Resolved by {dispute.resolvedBy?.name}</p>
          </div>
        ) : user.role === 'admin' ? (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Admin Mediation</p>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={3}
              className="form-input resize-none mb-3"
              placeholder="Resolution notes (visible to both parties)..."
            />
            <div className="flex gap-2">
              <button onClick={() => handleResolve('resolved')} disabled={resolving} className="btn-primary text-sm">
                Mark Resolved
              </button>
              <button onClick={() => handleResolve('rejected')} disabled={resolving} className="btn-secondary text-sm">
                Reject Dispute
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default DisputeDetailPage;
