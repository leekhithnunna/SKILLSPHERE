import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import paymentService from '../services/paymentService';

const statusBadge = {
  created: 'bg-gray-100 text-gray-500',
  escrow: 'bg-blue-100 text-blue-700',
  released: 'bg-green-100 text-green-700',
  refunded: 'bg-red-100 text-red-600',
  failed: 'bg-red-100 text-red-600',
};

const TransactionHistoryPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const { data } = await paymentService.getMyPayments();
        setPayments(data.data);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const totalEscrowed = payments.filter((p) => p.status === 'escrow').reduce((sum, p) => sum + p.amount, 0);
  const totalReleased = payments.filter((p) => p.status === 'released').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Transaction History</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {user?.role === 'freelancer' ? 'Payments you have received' : 'Payments you have made'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">In Escrow</p>
          <p className="text-xl font-bold text-blue-600">${totalEscrowed}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
            {user?.role === 'freelancer' ? 'Total Earned' : 'Total Paid Out'}
          </p>
          <p className="text-xl font-bold text-green-600">${totalReleased}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : payments.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 text-lg mb-2">No transactions yet</p>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Gig</th>
                <th className="text-left px-4 py-3">{user?.role === 'freelancer' ? 'Client' : 'Freelancer'}</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id} className="border-t border-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/gigs/${p.gig?._id}`} className="text-primary-600 hover:underline">
                      {p.gig?.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {user?.role === 'freelancer' ? p.client?.name : p.freelancer?.name}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">${p.amount}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(p.createdAt).toLocaleDateString()}
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

export default TransactionHistoryPage;
