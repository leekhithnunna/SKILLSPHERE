import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';
import DashboardLayout from './layouts/DashboardLayout';
import { connectSocket, disconnectSocket } from './services/socket';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import TwoFactorPage from './pages/TwoFactorPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import FreelancerProfilePage from './pages/FreelancerProfilePage';
import PublicProfilePage from './pages/PublicProfilePage';
import ChatPage from './pages/ChatPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminGigsPage from './pages/admin/AdminGigsPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import FindFreelancersPage from './pages/FindFreelancersPage';
import SchedulerPage from './pages/SchedulerPage';

// Week 2 pages
import BrowseGigsPage from './pages/BrowseGigsPage';
import GigDetailsPage from './pages/GigDetailsPage';
import CreateGigPage from './pages/CreateGigPage';
import EditGigPage from './pages/EditGigPage';
import MyGigsPage from './pages/MyGigsPage';
import MyProposalsPage from './pages/MyProposalsPage';
import InvitedGigsPage from './pages/InvitedGigsPage';
import GigProposalsPage from './pages/GigProposalsPage';

const App = () => {
  const { token, isAuthenticated } = useSelector((state) => state.auth);

  // Keep the Socket.IO connection in lockstep with auth state — connects on
  // login/refresh-with-token, disconnects on logout.
  useEffect(() => {
    if (isAuthenticated && token) {
      connectSocket(token);
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, token]);

  return (
    <Routes>
      {/* ── Public routes (redirect to /dashboard if already authenticated) ── */}
      <Route element={<PublicRoute />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-2fa" element={<TwoFactorPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      </Route>

      {/* ── Public regardless of auth state ── */}
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

      {/* ── Protected routes (require authentication) ── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Week 1 */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/freelancer-profile" element={<FreelancerProfilePage />} />
          <Route path="/users/:id" element={<PublicProfilePage />} />
          <Route path="/messages" element={<ChatPage />} />
          <Route path="/messages/:conversationId" element={<ChatPage />} />
          <Route path="/payments" element={<TransactionHistoryPage />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/gigs" element={<AdminGigsPage />} />
          <Route path="/admin/payments" element={<AdminPaymentsPage />} />

          <Route path="/find-freelancers" element={<FindFreelancersPage />} />
          <Route path="/scheduler" element={<SchedulerPage />} />

          {/* Week 2 — Gigs */}
          <Route path="/gigs" element={<BrowseGigsPage />} />
          <Route path="/gigs/create" element={<CreateGigPage />} />
          <Route path="/gigs/edit/:id" element={<EditGigPage />} />
          <Route path="/gigs/:id" element={<GigDetailsPage />} />
          <Route path="/my-gigs" element={<MyGigsPage />} />
          <Route path="/gigs/:id/proposals" element={<GigProposalsPage />} />

          {/* Week 2 — Proposals */}
          <Route path="/my-proposals" element={<MyProposalsPage />} />
          <Route path="/invited-gigs" element={<InvitedGigsPage />} />
        </Route>
      </Route>

      {/* 404 fallback */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
              <p className="text-gray-500 mb-6">Page not found</p>
              <a href="/" className="btn-primary">Go Home</a>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

export default App;
