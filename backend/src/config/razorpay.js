const crypto = require('crypto');

const isConfigured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

let razorpayClient = null;
if (isConfigured) {
  const Razorpay = require('razorpay');
  razorpayClient = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.log(
    '[payments] No Razorpay credentials set — using the built-in mock payment gateway (orders/captures/refunds are simulated, no real money moves).'
  );
}

/**
 * Creates a payment order. amount is in whole currency units (e.g. dollars);
 * Razorpay itself expects the smallest unit (e.g. cents), so we convert.
 */
const createOrder = async ({ amount, currency = 'USD', receipt }) => {
  if (razorpayClient) {
    const order = await razorpayClient.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt,
    });
    return { orderId: order.id, isMock: false };
  }

  return { orderId: `order_mock_${crypto.randomBytes(10).toString('hex')}`, isMock: true };
};

/**
 * Verifies the HMAC signature Razorpay Checkout returns after a successful
 * payment. In mock mode there is no real checkout, so verification always
 * succeeds (the caller is expected to have generated a matching mock
 * payment id itself).
 */
const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  if (!isConfigured) return true;

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expected === signature;
};

/**
 * Issues a refund. In mock mode this just returns a fake refund id — no
 * real money moves.
 */
const refundPayment = async ({ paymentId, amount }) => {
  if (razorpayClient) {
    const refund = await razorpayClient.payments.refund(paymentId, {
      amount: Math.round(amount * 100),
    });
    return { refundId: refund.id, isMock: false };
  }

  return { refundId: `rfnd_mock_${crypto.randomBytes(10).toString('hex')}`, isMock: true };
};

module.exports = { isConfigured, createOrder, verifyPaymentSignature, refundPayment };
