import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';
import DashboardLayout from './layouts/DashboardLayout';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';

// Week 2 pages
import BrowseGigsPage from './pages/BrowseGigsPage';
import GigDetailsPage from './pages/GigDetailsPage';
import CreateGigPage from './pages/CreateGigPage';
import EditGigPage from './pages/EditGigPage';
import MyGigsPage from './pages/MyGigsPage';
import MyProposalsPage from './pages/MyProposalsPage';

const App = () => {
  return (
    <Routes>
      {/* ── Public routes (redirect to /dashboard if already authenticated) ── */}
      <Route element={<PublicRoute />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* ── Protected routes (require authentication) ── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Week 1 */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Week 2 — Gigs */}
          <Route path="/gigs" element={<BrowseGigsPage />} />
          <Route path="/gigs/create" element={<CreateGigPage />} />
          <Route path="/gigs/edit/:id" element={<EditGigPage />} />
          <Route path="/gigs/:id" element={<GigDetailsPage />} />
          <Route path="/my-gigs" element={<MyGigsPage />} />

          {/* Week 2 — Proposals */}
          <Route path="/my-proposals" element={<MyProposalsPage />} />
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
