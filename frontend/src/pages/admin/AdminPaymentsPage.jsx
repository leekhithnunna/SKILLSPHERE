import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';

const statusBadge = {
  created: 'bg-gray-100 text-gray-500',
  escrow: 'bg-blue-100 text-blue-700',
  released: 'bg-green-100 text-green-700',
  refunded: 'bg-red-100 text-red-600',
  failed: 'bg-red-100 text-red-600',
};

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [flaggedReviews, setFlaggedReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminService.getPayments(), adminService.getFlaggedReviews()])
      .then(([paymentsRes, reviewsRes]) => {
        setPayments(paymentsRes.data.data);
        setFlaggedReviews(reviewsRes.data.data);
      })
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
        <h1 className="text-xl font-bold text-gray-900">Payment Monitoring &amp; Fraud Detection</h1>
        <p className="text-sm text-gray-500 mt-0.5">{payments.length} transactions · {flaggedReviews.length} flagged reviews</p>
      </div>

      {flaggedReviews.length > 0 && (
        <div className="card border-red-100">
          <h2 className="text-sm font-bold text-red-700 uppercase tracking-wide mb-3">Flagged Reviews (possible fraud)</h2>
          <div className="space-y-2">
            {flaggedReviews.map((r) => (
              <div key={r._id} className="p-3 rounded-lg bg-red-50 text-sm">
                <p className="text-gray-900">
                  <span className="font-medium">{r.reviewer?.name}</span> → <span className="font-medium">{r.reviewee?.name}</span>{' '}
                  on "{r.gig?.title}" — {r.rating}★
                </p>
                <p className="text-xs text-red-600 mt-1">{r.flagReason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Gig</th>
              <th className="text-left px-4 py-3">Client</th>
              <th className="text-left px-4 py-3">Freelancer</th>
              <th className="text-left px-4 py-3">Amount</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Mode</th>
              <th className="text-left px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p._id} className="border-t border-gray-50">
                <td className="px-4 py-3">
                  <Link to={`/gigs/${p.gig?._id}`} className="text-primary-600 hover:underline">{p.gig?.title}</Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{p.client?.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.freelancer?.name}</td>
                <td className="px-4 py-3 font-medium text-gray-900">${p.amount}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[p.status]}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{p.isMock ? 'Mock' : 'Live'}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPaymentsPage;
