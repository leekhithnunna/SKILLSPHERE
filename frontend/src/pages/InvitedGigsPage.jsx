import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import gigService from '../services/gigService';

const statusColors = {
  open: 'bg-green-100 text-green-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  completed: 'bg-gray-100 text-gray-600',
  closed: 'bg-red-100 text-red-600',
};

const InvitedGigsPage = () => {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvited = async () => {
      try {
        const { data } = await gigService.getInvitedGigs();
        setGigs(data.data);
      } catch {
        setError('Failed to load invitations.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvited();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Gig Invitations</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gigs clients have personally invited you to</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : gigs.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 text-lg mb-2">No invitations yet</p>
          <p className="text-gray-400 text-sm">Clients can invite you directly to gigs that match your skills</p>
        </div>
      ) : (
        <div className="space-y-4">
          {gigs.map((gig) => (
            <div key={gig._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-base font-semibold text-gray-900 truncate">{gig.title}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[gig.status] || 'bg-gray-100 text-gray-600'}`}>
                      {gig.status.charAt(0).toUpperCase() + gig.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">{gig.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="font-semibold text-primary-600 text-sm">
                      {gig.budgetMin === gig.budgetMax ? `$${gig.budgetMin}` : `$${gig.budgetMin}–$${gig.budgetMax}`}
                    </span>
                    <span>Invited by {gig.client?.name}</span>
                  </div>
                </div>
                <Link to={`/gigs/${gig._id}`} className="btn-primary text-xs py-1.5 px-3 shrink-0">
                  View &amp; Apply
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvitedGigsPage;
