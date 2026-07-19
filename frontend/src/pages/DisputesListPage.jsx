import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import disputeService from '../services/disputeService';

const statusBadge = {
  open: 'bg-yellow-100 text-yellow-700',
  under_review: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
};

const DisputesListPage = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    disputeService.getMyDisputes().then(({ data }) => setDisputes(data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Disputes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Disputes you've raised or that were raised against you</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : disputes.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 text-lg mb-2">No disputes</p>
          <p className="text-gray-400 text-sm">You can raise one from a gig's detail page if a payment issue comes up</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <Link key={d._id} to={`/disputes/${d._id}`} className="card flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-sm font-semibold text-gray-900">{d.reason}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  On "{d.gig?.title}" · {d.raisedBy?.name} vs {d.against?.name}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[d.status]}`}>
                {d.status.replace('_', ' ')}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default DisputesListPage;
