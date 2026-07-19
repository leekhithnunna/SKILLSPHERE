import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';

const statusColors = {
  open: 'bg-green-100 text-green-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  completed: 'bg-gray-100 text-gray-600',
  closed: 'bg-red-100 text-red-600',
};

const AdminGigsPage = () => {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const fetchGigs = async () => {
    try {
      const { data } = await adminService.getGigs();
      setGigs(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGigs();
  }, []);

  const handleToggleApprove = async (gig) => {
    setBusyId(gig._id);
    try {
      await adminService.approveGig(gig._id, !gig.isApproved);
      setGigs((prev) => prev.map((g) => (g._id === gig._id ? { ...g, isApproved: !g.isApproved } : g)));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Manage Gigs</h1>
        <p className="text-sm text-gray-500 mt-0.5">{gigs.length} gigs platform-wide</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Gig</th>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Budget</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Approval</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {gigs.map((g) => (
                <tr key={g._id} className="border-t border-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/gigs/${g._id}`} className="text-primary-600 hover:underline">{g.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{g.client?.name}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {g.budgetMin === g.budgetMax ? `$${g.budgetMin}` : `$${g.budgetMin}–$${g.budgetMax}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[g.status] || 'bg-gray-100 text-gray-600'}`}>
                      {g.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {g.isApproved ? (
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">Approved</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">Hidden</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleApprove(g)}
                      disabled={busyId === g._id}
                      className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                      {g.isApproved ? 'Hide from listing' : 'Approve'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminGigsPage;
