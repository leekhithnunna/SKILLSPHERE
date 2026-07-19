const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let loadPromise = null;

/**
 * Lazily injects the Razorpay Checkout script. Only needed in "real" mode
 * (a keyId is present) — mock-mode payments never call this.
 */
const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return loadPromise;
};

export default loadRazorpayScript;
