import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import proposalService from '../services/proposalService';

const statusConfig = {
  pending: { label: 'Pending', classes: 'bg-yellow-100 text-yellow-700' },
  accepted: { label: 'Accepted', classes: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', classes: 'bg-red-100 text-red-600' },
  withdrawn: { label: 'Withdrawn', classes: 'bg-gray-100 text-gray-500' },
};

const MyProposalsPage = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawingId, setWithdrawingId] = useState(null);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const { data } = await proposalService.getMyProposals();
        setProposals(data.data);
      } catch {
        setError('Failed to load your proposals.');
      } finally {
        setLoading(false);
      }
    };
    fetchProposals();
  }, []);

  const handleWithdraw = async (proposalId) => {
    if (!window.confirm('Are you sure you want to withdraw this proposal?')) return;
    setWithdrawingId(proposalId);
    try {
      await proposalService.withdrawProposal(proposalId);
      setProposals((prev) =>
        prev.map((p) => (p._id === proposalId ? { ...p, status: 'withdrawn' } : p))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to withdraw proposal.');
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Proposals</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {proposals.length} proposal{proposals.length !== 1 ? 's' : ''} submitted
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : proposals.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 text-lg mb-2">No proposals submitted yet</p>
          <p className="text-gray-400 text-sm mb-6">
            Browse available gigs and submit your first proposal
          </p>
          <Link to="/gigs" className="btn-primary">
            Browse Gigs
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const cfg = statusConfig[proposal.status] || statusConfig.pending;
            return (
              <div key={proposal._id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {proposal.gig?.title || 'Gig Removed'}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.classes}`}
                      >
                        {cfg.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-3">
                      <span>
                        Bid:{' '}
                        <span className="font-semibold text-primary-600 text-sm">
                          ${proposal.bidAmount}
                        </span>
                      </span>
                      <span>{proposal.estimatedDays} days estimated</span>
                      {proposal.gig?.budget && (
                        <span>Gig budget: ${proposal.gig.budget}</span>
                      )}
                      <span>
                        Submitted {new Date(proposal.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2">{proposal.coverLetter}</p>

                    {proposal.gig?.skillsRequired?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {proposal.gig.skillsRequired.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {proposal.gig?._id && (
                      <Link
                        to={`/gigs/${proposal.gig._id}`}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        View Gig
                      </Link>
                    )}
                    {proposal.status === 'pending' && (
                      <button
                        onClick={() => handleWithdraw(proposal._id)}
                        disabled={withdrawingId === proposal._id}
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-white text-red-600 font-medium text-xs border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        {withdrawingId === proposal._id ? 'Withdrawing...' : 'Withdraw'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyProposalsPage;
