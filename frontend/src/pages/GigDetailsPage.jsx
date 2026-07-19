import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import gigService from '../services/gigService';
import ProposalForm from './ProposalForm';
import resolveFileUrl from '../utils/resolveFileUrl';

const statusColors = {
  open: 'bg-green-100 text-green-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  completed: 'bg-gray-100 text-gray-600',
  closed: 'bg-red-100 text-red-600',
};

const GigDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProposalForm, setShowProposalForm] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);

  const [attachmentFile, setAttachmentFile] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const fetchGig = async () => {
    try {
      const { data } = await gigService.getGigById(id);
      setGig(data.data);
    } catch {
      setError('Gig not found or failed to load.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setInviteMessage('');
    try {
      await gigService.inviteFreelancer(id, inviteEmail);
      setInviteMessage(`Invited ${inviteEmail}`);
      setInviteEmail('');
    } catch (err) {
      setInviteMessage(err.response?.data?.message || 'Failed to invite freelancer.');
    } finally {
      setInviting(false);
    }
  };

  const handleAddAttachment = async (e) => {
    e.preventDefault();
    if (!attachmentFile) return;
    const formData = new FormData();
    formData.append('file', attachmentFile);
    setUploadingAttachment(true);
    try {
      const { data } = await gigService.addAttachment(id, formData);
      setGig(data.data);
      setAttachmentFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload attachment.');
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleRemoveAttachment = async (attachmentId) => {
    try {
      const { data } = await gigService.removeAttachment(id, attachmentId);
      setGig(data.data);
    } catch {
      // no-op
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

  if (error || !gig) {
    return (
      <div className="card text-center py-16">
        <p className="text-gray-500 mb-4">{error || 'Gig not found'}</p>
        <button onClick={() => navigate(-1)} className="btn-secondary">
          Go Back
        </button>
      </div>
    );
  }

  const isClient = user?.role === 'client';
  const isFreelancer = user?.role === 'freelancer';
  const isOwner = gig.client?._id === user?._id;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <h1 className="text-2xl font-bold text-gray-900 flex-1">{gig.title}</h1>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              statusColors[gig.status] || 'bg-gray-100 text-gray-600'
            }`}
          >
            {gig.status.charAt(0).toUpperCase() + gig.status.slice(1)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Budget</p>
            <p className="text-xl font-bold text-primary-600">
              {gig.budgetMin === gig.budgetMax ? `$${gig.budgetMin}` : `$${gig.budgetMin} – $${gig.budgetMax}`}
            </p>
          </div>
          {gig.deadline && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Deadline</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(gig.deadline).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Posted</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(gig.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Description</h2>
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
            {gig.description}
          </p>
        </div>

        {gig.skillsRequired?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Skills Required</h2>
            <div className="flex flex-wrap gap-2">
              {gig.skillsRequired.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {gig.milestones?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Milestones</h2>
            <div className="space-y-2">
              {gig.milestones.map((m) => (
                <div key={m._id} className="flex items-center justify-between text-sm p-2.5 rounded-lg bg-gray-50">
                  <span>{m.title}</span>
                  <span className="flex items-center gap-3">
                    <span className="font-medium text-primary-600">${m.amount}</span>
                    <span className="text-xs text-gray-400 capitalize">{m.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(gig.attachments?.length > 0 || isOwner) && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Attachments</h2>
            <div className="space-y-2 mb-3">
              {gig.attachments?.map((a) => (
                <div key={a._id} className="flex items-center justify-between text-sm p-2.5 rounded-lg bg-gray-50">
                  <a href={resolveFileUrl(a.url)} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline truncate">
                    {a.name}
                  </a>
                  {isOwner && (
                    <button onClick={() => handleRemoveAttachment(a._id)} className="text-red-400 hover:text-red-600 text-xs shrink-0">
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {(!gig.attachments || gig.attachments.length === 0) && (
                <p className="text-gray-400 text-sm italic">No documents attached.</p>
              )}
            </div>
            {isOwner && (
              <form onSubmit={handleAddAttachment} className="flex gap-2">
                <input
                  type="file"
                  onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                  className="text-sm flex-1"
                />
                <button type="submit" disabled={uploadingAttachment || !attachmentFile} className="btn-secondary shrink-0 text-xs">
                  {uploadingAttachment ? 'Uploading...' : 'Attach'}
                </button>
              </form>
            )}
          </div>
        )}

        {isOwner && (
          <div className="mb-6 pt-4 border-t border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Invite a Freelancer</h2>
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="freelancer@example.com"
                className="form-input flex-1"
                required
              />
              <button type="submit" disabled={inviting} className="btn-secondary shrink-0">
                {inviting ? 'Inviting...' : 'Invite'}
              </button>
            </form>
            {inviteMessage && <p className="text-xs text-gray-500 mt-1.5">{inviteMessage}</p>}
          </div>
        )}

        {/* Client info */}
        <div className="pt-4 border-t border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Posted by</h2>
          <div className="flex items-center gap-3">
            {gig.client?.profileImage ? (
              <img
                src={gig.client.profileImage}
                alt={gig.client.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-700 font-semibold text-sm">
                  {gig.client?.name?.charAt(0)?.toUpperCase() || 'C'}
                </span>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">{gig.client?.name}</p>
              {gig.client?.bio && (
                <p className="text-xs text-gray-500 line-clamp-1">{gig.client.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          {isFreelancer && gig.status === 'open' && (
            <button
              onClick={() => setShowProposalForm((v) => !v)}
              className="btn-primary"
            >
              {showProposalForm ? 'Cancel' : 'Submit Proposal'}
            </button>
          )}
          {isClient && isOwner && (
            <>
              <Link to={`/gigs/edit/${gig._id}`} className="btn-secondary">
                Edit Gig
              </Link>
              <Link to={`/my-gigs`} className="btn-secondary">
                View My Gigs
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Proposal form */}
      {showProposalForm && (
        <ProposalForm
          gigId={gig._id}
          onSuccess={() => setShowProposalForm(false)}
        />
      )}
    </div>
  );
};

export default GigDetailsPage;
