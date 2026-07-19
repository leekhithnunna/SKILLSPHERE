import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import authService from '../services/authService';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const { data } = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(data.message || 'Email verified successfully');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification link is invalid or has expired');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-violet-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md card shadow-md text-center">
        {status === 'verifying' && (
          <>
            <svg className="animate-spin w-8 h-8 text-primary-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-gray-600">Verifying your email…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h1 className="text-lg font-bold text-gray-900 mb-2">Email verified</h1>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <Link to="/login" className="btn-primary inline-block">Go to Login</Link>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-lg font-bold text-gray-900 mb-2">Verification failed</h1>
            <p className="text-red-600 text-sm mb-6">{message}</p>
            <Link to="/login" className="btn-secondary inline-block">Back to Login</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
