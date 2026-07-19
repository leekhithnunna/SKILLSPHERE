import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [busyId, setBusyId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getUsers({ search: search || undefined, role: role || undefined });
      setUsers(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSuspendToggle = async (user) => {
    setBusyId(user._id);
    try {
      await adminService.suspendUser(user._id, !user.isSuspended);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, isSuspended: !u.isSuspended } : u)));
    } finally {
      setBusyId(null);
    }
  };

  const handleVerify = async (user) => {
    setBusyId(user._id);
    try {
      await adminService.verifyFreelancer(user._id);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, freelancerProfile: { ...u.freelancerProfile, isVerifiedBadge: true } } : u))
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Manage Users</h1>
        <p className="text-sm text-gray-500 mt-0.5">{users.length} users</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchUsers();
        }}
        className="card flex gap-3"
      >
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email..." className="form-input flex-1" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="form-input w-40">
          <option value="">All Roles</option>
          <option value="client">Client</option>
          <option value="freelancer">Freelancer</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" className="btn-primary">Search</button>
      </form>

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
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Rating</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t border-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/users/${u._id}`} className="text-gray-900 font-medium hover:text-primary-600">{u.name}</Link>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">{u.role}</td>
                  <td className="px-4 py-3">
                    {u.isSuspended ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-medium">Suspended</span>
                    ) : u.isVerified ? (
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">Active</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">Unverified email</span>
                    )}
                    {u.freelancerProfile?.isVerifiedBadge && (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">✓ Badge</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {u.reviewCount > 0 ? `${u.reputationScore}★ (${u.reviewCount})` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSuspendToggle(u)}
                        disabled={busyId === u._id || u.role === 'admin'}
                        className={`text-xs px-2.5 py-1 rounded-lg border ${
                          u.isSuspended
                            ? 'border-green-200 text-green-700 hover:bg-green-50'
                            : 'border-red-200 text-red-600 hover:bg-red-50'
                        } disabled:opacity-40`}
                      >
                        {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                      {u.role === 'freelancer' && !u.freelancerProfile?.isVerifiedBadge && (
                        <button
                          onClick={() => handleVerify(u)}
                          disabled={busyId === u._id}
                          className="text-xs px-2.5 py-1 rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50 disabled:opacity-40"
                        >
                          Verify
                        </button>
                      )}
                    </div>
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

export default AdminUsersPage;
