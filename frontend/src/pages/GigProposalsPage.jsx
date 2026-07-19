import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import gigService from '../services/gigService';
import proposalService from '../services/proposalService';
import matchingService from '../services/matchingService';
import resolveFileUrl from '../utils/resolveFileUrl';

const statusConfig = {
  pending: { label: 'Pending', classes: 'bg-yellow-100 text-yellow-700' },
  negotiating: { label: 'Negotiating', classes: 'bg-purple-100 text-purple-700' },
  accepted: { label: 'Accepted', classes: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', classes: 'bg-red-100 text-red-600' },
  withdrawn: { label: 'Withdrawn', classes: 'bg-gray-100 text-gray-500' },
};

const ProposalCard = ({ proposal, onAccept, onReject, onNegotiate, busy }) => {
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [showCounterForm, setShowCounterForm] = useState(false);
  const cfg = statusConfig[proposal.status] || statusConfig.pending;
  const canAct = ['pending', 'negotiating'].includes(proposal.status);

  const submitCounter = async () => {
    if (!counterAmount) return;
    await onNegotiate(proposal._id, Number(counterAmount), counterMessage);
    setCounterAmount('');
    setCounterMessage('');
    setShowCounterForm(false);
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-3">
        <Link to={`/users/${proposal.freelancer?._id}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span className="text-primary-700 font-semibold text-sm">
              {proposal.freelancer?.name?.charAt(0)?.toUpperCase() || 'F'}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600">{proposal.freelancer?.name}</p>
            <p className="text-xs text-gray-400">{proposal.freelancer?.email}</p>
          </div>
        </Link>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.classes}`}>
          {cfg.label}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-3">{proposal.coverLetter}</p>

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <span>
          Bid: <span className="font-semibold text-primary-600 text-sm">${proposal.bidAmount}</span>
        </span>
        <span>{proposal.estimatedDays} days estimated</span>
      </div>

      {proposal.negotiationHistory?.length > 0 && (
        <div className="mb-3 p-3 rounded-lg bg-gray-50 space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Negotiation History</p>
          {proposal.negotiationHistory.map((n, idx) => (
            <p key={idx} className="text-xs text-gray-600">
              <span className="font-medium capitalize">{n.by}</span> countered with{' '}
              <span className="font-semibold text-primary-600">${n.amount}</span>
              {n.message && <span className="text-gray-400"> — "{n.message}"</span>}
            </p>
          ))}
        </div>
      )}

      {canAct && (
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
          <button onClick={() => onAccept(proposal._id)} disabled={busy} className="btn-primary text-xs py-1.5 px-3">
            Accept
          </button>
          <button
            onClick={() => setShowCounterForm((v) => !v)}
            disabled={busy}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            Negotiate
          </button>
          <button
            onClick={() => onReject(proposal._id)}
            disabled={busy}
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-white text-red-600 font-medium text-xs border border-red-200 hover:bg-red-50 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}

      {showCounterForm && (
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            min="1"
            placeholder="Counter amount ($)"
            value={counterAmount}
            onChange={(e) => setCounterAmount(e.target.value)}
            className="form-input w-40"
          />
          <input
            type="text"
            placeholder="Optional message"
            value={counterMessage}
            onChange={(e) => setCounterMessage(e.target.value)}
            className="form-input flex-1"
          />
          <button onClick={submitCounter} disabled={busy || !counterAmount} className="btn-secondary shrink-0 text-xs">
            Send
          </button>
        </div>
      )}
    </div>
  );
};

const GigProposalsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [gig, setGig] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [invitingId, setInvitingId] = useState(null);

  const fetchData = async () => {
    try {
      const [gigRes, proposalsRes] = await Promise.all([
        gigService.getGigById(id),
        proposalService.getProposalsByGig(id),
      ]);
      setGig(gigRes.data.data);
      setProposals(proposalsRes.data.data);

      if (gigRes.data.data.status === 'open') {
        matchingService
          .getFreelancerRecommendations(id)
          .then(({ data }) => setRecommendations(data.data))
          .catch(() => {});
      }
    } catch {
      setError('Failed to load proposals.');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteRecommended = async (freelancerId) => {
    setInvitingId(freelancerId);
    try {
      await gigService.inviteFreelancerById(id, freelancerId);
      setRecommendations((prev) => prev.filter((r) => r.freelancer._id !== freelancerId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to invite freelancer.');
    } finally {
      setInvitingId(null);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAccept = async (proposalId) => {
    setBusyId(proposalId);
    try {
      await proposalService.acceptProposal(proposalId);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept proposal.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (proposalId) => {
    setBusyId(proposalId);
    try {
      await proposalService.rejectProposal(proposalId);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject proposal.');
    } finally {
      setBusyId(null);
    }
  };

  const handleNegotiate = async (proposalId, amount, message) => {
    setBusyId(proposalId);
    try {
      await proposalService.negotiateProposal(proposalId, { amount, message });
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send counter-offer.');
    } finally {
      setBusyId(null);
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Proposals for "{gig?.title}"</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {proposals.length} proposal{proposals.length !== 1 ? 's' : ''} ·{' '}
          <Link to={`/gigs/${id}`} className="text-primary-600 hover:underline">View gig</Link>
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
      )}

      {recommendations.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-1">AI-Recommended Freelancers</h2>
          <p className="text-xs text-gray-400 mb-3">Ranked by skill match, reputation, and location</p>
          <div className="space-y-2">
            {recommendations.map((r) => (
              <div key={r.freelancer._id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-gray-50">
                <Link to={`/users/${r.freelancer._id}`} className="flex items-center gap-3 min-w-0 group">
                  {r.freelancer.profileImage ? (
                    <img src={resolveFileUrl(r.freelancer.profileImage)} alt={r.freelancer.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                      <span className="text-primary-700 font-semibold text-xs">{r.freelancer.name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-primary-600 truncate">{r.freelancer.name}</p>
                    <p className="text-xs text-gray-400">
                      {Math.round(r.skillScore * 100)}% skill match
                      {r.freelancer.reviewCount > 0 && ` · ${r.freelancer.reputationScore}★ (${r.freelancer.reviewCount})`}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => handleInviteRecommended(r.freelancer._id)}
                  disabled={invitingId === r.freelancer._id}
                  className="btn-secondary text-xs py-1.5 px-3 shrink-0"
                >
                  {invitingId === r.freelancer._id ? 'Inviting...' : 'Invite'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {proposals.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 text-lg mb-2">No proposals yet</p>
          <p className="text-gray-400 text-sm">Check back soon, or invite a freelancer directly from the gig page</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <ProposalCard
              key={proposal._id}
              proposal={proposal}
              busy={busyId === proposal._id}
              onAccept={handleAccept}
              onReject={handleReject}
              onNegotiate={handleNegotiate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GigProposalsPage;
