import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../redux/authSlice';
import authService from '../services/authService';

const TwoFactorPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await authService.verifyTwoFactor({ userId, otp });
      dispatch(login({ user: data.user, token: data.token }));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-violet-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <span className="text-white font-bold">SS</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">SkillSphere</span>
          </Link>
          <p className="text-gray-500 text-sm mt-2">Enter the code we emailed you</p>
        </div>

        <div className="card shadow-md">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="otp" className="form-label">6-digit code</label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="form-input text-center tracking-[0.5em] text-lg"
                placeholder="000000"
                disabled={loading}
                autoFocus
              />
            </div>

            <button type="submit" className="btn-primary w-full py-2.5" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorPage;
