import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import dashboardService from '../services/dashboardService';

const StatCard = ({ label, value, accent }) => (
  <div className="card">
    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
    <p className={`text-2xl font-bold ${accent || 'text-gray-900'}`}>{value}</p>
  </div>
);

const FreelancerAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService
      .getFreelancerAnalytics()
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
        <h1 className="text-xl font-bold text-gray-900">My Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">How your profile and work are performing</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Profile Views" value={analytics.profileViews} />
        <StatCard label="Gig Applications" value={analytics.totalApplications} />
        <StatCard label="Total Earned" value={`$${analytics.totalEarned}`} accent="text-green-600" />
        <StatCard label="In Escrow" value={`$${analytics.pendingEscrow}`} accent="text-blue-600" />
      </div>

      {analytics.monthlyRevenue.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={analytics.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
          Client Feedback {analytics.reviewCount > 0 && `(${analytics.reviewCount} reviews · ${analytics.reputationScore}★ weighted score)`}
        </h2>
        {analytics.reviewCount === 0 ? (
          <p className="text-gray-400 text-sm italic">No reviews yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(analytics.feedbackBreakdown).map(([key, value]) => (
              <div key={key} className="p-3 rounded-lg bg-gray-50 text-center">
                <p className="text-xs text-gray-400 capitalize mb-1">{key}</p>
                <p className="text-lg font-bold text-gray-900">{value ?? '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Applications by Status</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(analytics.applicationStatusCounts).map(([status, count]) => (
            <div key={status} className="px-4 py-2 rounded-lg bg-gray-50">
              <span className="text-sm font-semibold text-gray-900">{count}</span>{' '}
              <span className="text-xs text-gray-400 capitalize">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FreelancerAnalyticsPage;
