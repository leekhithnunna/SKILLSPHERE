import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gigService from '../services/gigService';
import proposalService from '../services/proposalService';

const statusColors = {
  open: 'bg-green-100 text-green-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  completed: 'bg-gray-100 text-gray-600',
  closed: 'bg-red-100 text-red-600',
};

const MyGigsPage = () => {
  const navigate = useNavigate();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [proposalCounts, setProposalCounts] = useState({});

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const { data } = await gigService.getMyGigs();
        setGigs(data.data);
        // Fetch proposal counts for each gig
        const counts = {};
        await Promise.all(
          data.data.map(async (gig) => {
            try {
              const res = await proposalService.getProposalsByGig(gig._id);
              counts[gig._id] = res.data.data.length;
            } catch {
              counts[gig._id] = 0;
            }
          })
        );
        setProposalCounts(counts);
      } catch {
        setError('Failed to load your gigs.');
      } finally {
        setLoading(false);
      }
    };
    fetchGigs();
  }, []);

  const handleDelete = async (gigId) => {
    if (!window.confirm('Are you sure you want to delete this gig?')) return;
    setDeletingId(gigId);
    try {
      await gigService.deleteGig(gigId);
      setGigs((prev) => prev.filter((g) => g._id !== gigId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete gig.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Gigs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{gigs.length} gig{gigs.length !== 1 ? 's' : ''} posted</p>
        </div>
        <Link to="/gigs/create" className="btn-primary">
          + Post New Gig
        </Link>
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
      ) : gigs.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 text-lg mb-2">No gigs posted yet</p>
          <p className="text-gray-400 text-sm mb-6">Post your first gig to start receiving proposals</p>
          <Link to="/gigs/create" className="btn-primary">
            Post a Gig
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {gigs.map((gig) => (
            <div key={gig._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {gig.title}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[gig.status] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {gig.status.charAt(0).toUpperCase() + gig.status.slice(1)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{gig.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span className="font-semibold text-primary-600 text-sm">${gig.budget}</span>
                    {gig.deadline && (
                      <span>Due {new Date(gig.deadline).toLocaleDateString()}</span>
                    )}
                    <span>
                      {proposalCounts[gig._id] ?? 0} proposal{(proposalCounts[gig._id] ?? 0) !== 1 ? 's' : ''}
                    </span>
                    <span>Posted {new Date(gig.createdAt).toLocaleDateString()}</span>
                  </div>

                  {gig.skillsRequired?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {gig.skillsRequired.slice(0, 4).map((skill) => (
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
                  <Link
                    to={`/gigs/${gig._id}`}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    View
                  </Link>
                  <Link
                    to={`/gigs/edit/${gig._id}`}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() =>
                      navigate(`/gigs/${gig._id}`, { state: { viewProposals: true } })
                    }
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    Proposals ({proposalCounts[gig._id] ?? 0})
                  </button>
                  <button
                    onClick={() => handleDelete(gig._id)}
                    disabled={deletingId === gig._id}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-white text-red-600 font-medium text-xs border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {deletingId === gig._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyGigsPage;
