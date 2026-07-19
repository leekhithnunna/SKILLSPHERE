import { useState, useEffect } from 'react';
import progressLogService from '../services/progressLogService';
import resolveFileUrl from '../utils/resolveFileUrl';

/**
 * Task-completion % bar + progress-log timeline for an in-progress gig.
 * Only the accepted freelancer can post updates; both parties can view.
 */
const ProgressTracker = ({ gig, isAcceptedFreelancer, onGigUpdate }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [percentage, setPercentage] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchLogs = async () => {
    try {
      const { data } = await progressLogService.getProgressLogs(gig._id);
      setLogs(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gig._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('message', message);
      if (percentage !== '') formData.append('completionPercentage', percentage);
      if (file) formData.append('file', file);

      await progressLogService.createProgressLog(gig._id, formData);
      setMessage('');
      setPercentage('');
      setFile(null);
      await fetchLogs();
      onGigUpdate?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-900">Progress</h2>
        <span className="text-sm font-bold text-primary-600">{gig.completionPercentage || 0}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-gray-100 mb-4">
        <div
          className="h-2 rounded-full bg-primary-600 transition-all"
          style={{ width: `${gig.completionPercentage || 0}%` }}
        />
      </div>

      {isAcceptedFreelancer && (
        <form onSubmit={handleSubmit} className="space-y-2 mb-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            className="form-input resize-none"
            placeholder="Post a progress update..."
          />
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              max="100"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              className="form-input w-32"
              placeholder="% complete"
            />
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm flex-1" />
            <button type="submit" disabled={submitting || !message.trim()} className="btn-secondary shrink-0 text-xs">
              {submitting ? 'Posting...' : 'Post Update'}
            </button>
          </div>
        </form>
      )}

      {!loading && logs.length > 0 && (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log._id} className="flex gap-3 pb-3 border-b border-gray-50 last:border-0">
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <span className="text-primary-700 font-semibold text-[10px]">{log.postedBy?.name?.charAt(0)?.toUpperCase()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-700">{log.message}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  <span>{log.postedBy?.name}</span>
                  <span>·</span>
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                  {log.completionPercentage !== null && (
                    <>
                      <span>·</span>
                      <span className="text-primary-600 font-medium">{log.completionPercentage}%</span>
                    </>
                  )}
                </div>
                {log.attachments?.map((a, idx) => (
                  <a key={idx} href={resolveFileUrl(a.url)} target="_blank" rel="noreferrer" className="block text-xs text-primary-600 hover:underline mt-1">
                    📎 {a.name}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
