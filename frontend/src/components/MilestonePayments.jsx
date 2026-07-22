import { useState, useEffect, useCallback } from 'react';
import paymentService from '../services/paymentService';
import loadRazorpayScript from '../utils/loadRazorpay';

const statusBadge = {
  created: 'bg-gray-100 text-gray-500',
  escrow: 'bg-blue-100 text-blue-700',
  released: 'bg-green-100 text-green-700',
  refunded: 'bg-red-100 text-red-600',
  failed: 'bg-red-100 text-red-600',
};

/**
 * Payments panel for a single gig — one row per milestone (or one row for
 * the whole gig if it has no milestones). Handles the full escrow flow:
 * pay -> escrow -> (freelancer marks milestone complete) -> release/refund.
 */
const MilestonePayments = ({ gig, user, isOwner, isAcceptedFreelancer, onMilestoneUpdate }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState(null);
  const [error, setError] = useState('');

  const fetchPayments = useCallback(async () => {
    try {
      const { data } = await paymentService.getPaymentsForGig(gig._id);
      setPayments(data.data);
    } catch {
      // Not authorized yet (e.g. no payments and not a participant) — fine, just show nothing
    } finally {
      setLoading(false);
    }
  }, [gig._id]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const paymentFor = (milestoneId) => payments.find((p) => p.milestoneId === milestoneId && p.status !== 'refunded' && p.status !== 'failed');

  const handlePay = async (milestoneId, amount) => {
    setBusyKey(milestoneId || 'full');
    setError('');
    try {
      const { data: order } = await paymentService.createOrder(gig._id, milestoneId);

      if (order.data.isMock) {
        await paymentService.verifyPayment({
          paymentId: order.data.paymentId,
          razorpayPaymentId: `mock_pay_${order.data.paymentId}`,
          razorpaySignature: 'mock',
        });
        await fetchPayments();
        onMilestoneUpdate?.();
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError('Failed to load Razorpay checkout.');
        return;
      }

      const rzp = new window.Razorpay({
        key: order.data.keyId,
        amount: Math.round(amount * 100),
        currency: order.data.currency,
        order_id: order.data.orderId,
        name: 'SkillSphere',
        description: gig.title,
        handler: async (response) => {
          await paymentService.verifyPayment({
            paymentId: order.data.paymentId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          await fetchPayments();
          onMilestoneUpdate?.();
        },
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed to start.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleRelease = async (paymentId) => {
    setBusyKey(paymentId);
    try {
      await paymentService.releasePayment(paymentId);
      await fetchPayments();
      onMilestoneUpdate?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to release payment.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleRefund = async (paymentId) => {
    if (!window.confirm('Refund this escrowed payment to yourself?')) return;
    setBusyKey(paymentId);
    try {
      await paymentService.refundPayment(paymentId, 'Client-initiated refund');
      await fetchPayments();
      onMilestoneUpdate?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to refund payment.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleMarkComplete = async (milestoneId) => {
    setBusyKey(milestoneId);
    try {
      await onMilestoneUpdate?.(milestoneId);
    } finally {
      setBusyKey(null);
    }
  };

  if (loading) return null;
  if (!isOwner && !isAcceptedFreelancer) return null;

  const rows = gig.milestones?.length > 0
    ? gig.milestones.map((m) => ({ milestone: m, payment: paymentFor(m._id) }))
    : [{ milestone: null, payment: payments.find((p) => !p.milestoneId && p.status !== 'refunded' && p.status !== 'failed') }];

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-2">Payments</h2>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <div className="space-y-2">
        {rows.map(({ milestone, payment }, idx) => {
          const label = milestone?.title || 'Full gig payment';
          const amount = milestone?.amount || gig.budgetMax;
          const key = milestone?._id || 'full';
          const busy = busyKey === key || busyKey === payment?._id;

          return (
            <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">
                  ${amount}
                  {milestone && <span className="capitalize"> · {milestone.status}</span>}
                  {payment && (
                    <span className={`ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${statusBadge[payment.status]}`}>
                      {payment.status}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isOwner && (!payment || payment.status === 'created') && (
                  <button onClick={() => handlePay(milestone?._id, amount)} disabled={busy} className="btn-primary text-xs py-1.5 px-3">
                    {busy ? 'Processing...' : payment ? `Retry Payment ($${amount})` : `Pay $${amount}`}
                  </button>
                )}
                {isAcceptedFreelancer && payment?.status === 'escrow' && milestone?.status === 'in-progress' && (
                  <button onClick={() => handleMarkComplete(milestone._id)} disabled={busy} className="btn-secondary text-xs py-1.5 px-3">
                    Mark Complete
                  </button>
                )}
                {isOwner && payment?.status === 'escrow' && (
                  <>
                    <button onClick={() => handleRelease(payment._id)} disabled={busy} className="btn-primary text-xs py-1.5 px-3">
                      Release
                    </button>
                    <button
                      onClick={() => handleRefund(payment._id)}
                      disabled={busy}
                      className="text-xs text-red-600 hover:underline px-1"
                    >
                      Refund
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {payments.some((p) => p.isMock) && (
        <p className="text-[11px] text-gray-400 mt-2">
          Running in Razorpay mock/test mode — no real money moves. Set RAZORPAY_KEY_ID/SECRET to use real test-mode payments.
        </p>
      )}
    </div>
  );
};

export default MilestonePayments;
