import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import adminService from '../../services/adminService';

const StatCard = ({ label, value, accent }) => (
  <div className="card">
    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
    <p className={`text-2xl font-bold ${accent || 'text-gray-900'}`}>{value}</p>
  </div>
);

const AdminDashboardPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getAnalytics()
      .then(({ data }) => setAnalytics(data.data))
      .finally(() => setLoading(false));
  }, []);

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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform-wide analytics and moderation</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Platform Revenue" value={`$${analytics.platformRevenue}`} accent="text-green-600" />
        <StatCard label="Active Freelancers (30d)" value={analytics.activeFreelancers} accent="text-primary-600" />
        <StatCard label="Job Success Rate" value={`${analytics.jobSuccessRate}%`} accent="text-primary-600" />
        <StatCard label="Completed Gigs" value={analytics.completedGigs} />
        <StatCard label="Total Freelancers" value={analytics.totalFreelancers} />
        <StatCard label="Total Clients" value={analytics.totalClients} />
        <StatCard label="Pending Gig Approvals" value={analytics.pendingApprovalGigs} accent={analytics.pendingApprovalGigs > 0 ? 'text-yellow-600' : undefined} />
        <StatCard label="Flagged Reviews" value={analytics.flaggedReviewCount} accent={analytics.flaggedReviewCount > 0 ? 'text-red-600' : undefined} />
      </div>

      {analytics.topCategories.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Top Skill Categories</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analytics.topCategories} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="skill" width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#0284c7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
