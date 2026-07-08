import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setDashboardStats, setDashboardLoading } from '../redux/dashboardSlice';
import dashboardService from '../services/dashboardService';

const roleBadgeClass = {
  client: 'badge-client',
  freelancer: 'badge-freelancer',
  admin: 'badge-admin',
};

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { stats, loading } = useSelector((state) => state.dashboard);

  useEffect(() => {
    const fetchStats = async () => {
      dispatch(setDashboardLoading(true));
      try {
        if (user?.role === 'client' || user?.role === 'admin') {
          const { data } = await dashboardService.getClientDashboard();
          dispatch(setDashboardStats(data.data));
        } else if (user?.role === 'freelancer') {
          const { data } = await dashboardService.getFreelancerDashboard();
          dispatch(setDashboardStats(data.data));
        }
      } catch {
        // Stats will just be null — not a critical error
      } finally {
        dispatch(setDashboardLoading(false));
      }
    };
    if (user) fetchStats();
  }, [user, dispatch]);

  const clientStats = [
    {
      label: 'Total Gigs',
      value: stats?.totalGigs ?? '—',
      icon: '📋',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Open Gigs',
      value: stats?.openGigs ?? '—',
      icon: '🟢',
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Active Gigs',
      value: stats?.activeGigs ?? '—',
      icon: '⚡',
      color: 'bg-yellow-50 text-yellow-600',
    },
    {
      label: 'Completed',
      value: stats?.completedGigs ?? '—',
      icon: '✅',
      color: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Proposals Received',
      value: stats?.totalProposalsReceived ?? '—',
      icon: '📩',
      color: 'bg-pink-50 text-pink-600',
    },
  ];

  const freelancerStats = [
    {
      label: 'Total Proposals',
      value: stats?.totalProposals ?? '—',
      icon: '📝',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Pending',
      value: stats?.pendingProposals ?? '—',
      icon: '⏳',
      color: 'bg-yellow-50 text-yellow-600',
    },
    {
      label: 'Accepted',
      value: stats?.acceptedProposals ?? '—',
      icon: '✅',
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Active Jobs',
      value: stats?.activeJobs ?? '—',
      icon: '💼',
      color: 'bg-violet-50 text-violet-600',
    },
  ];

  const displayStats =
    user?.role === 'freelancer' ? freelancerStats : clientStats;

  const clientQuickActions = [
    {
      to: '/gigs/create',
      label: 'Post a Gig',
      sub: 'Attract top freelancers',
      bg: 'bg-green-50',
      icon: (
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      to: '/my-gigs',
      label: 'My Gigs',
      sub: 'Manage your postings',
      bg: 'bg-blue-50',
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      to: '/profile',
      label: 'Edit Profile',
      sub: 'Update your info',
      bg: 'bg-primary-50',
      icon: (
        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  const freelancerQuickActions = [
    {
      to: '/gigs',
      label: 'Browse Gigs',
      sub: 'Find your next project',
      bg: 'bg-green-50',
      icon: (
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      to: '/my-proposals',
      label: 'My Proposals',
      sub: 'Track your applications',
      bg: 'bg-blue-50',
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      to: '/profile',
      label: 'Edit Profile',
      sub: 'Showcase your skills',
      bg: 'bg-primary-50',
      icon: (
        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  const quickActions =
    user?.role === 'freelancer' ? freelancerQuickActions : clientQuickActions;

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="card flex items-start gap-4">
        {user?.profileImage ? (
          <img
            src={user.profileImage}
            alt={user.name}
            className="w-14 h-14 rounded-full object-cover ring-2 ring-primary-100"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center ring-2 ring-primary-100 shrink-0">
            <span className="text-primary-700 font-bold text-xl">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-gray-900">
              Welcome back, {user?.name?.split(' ')[0] || 'there'}!
            </h1>
            <span className={roleBadgeClass[user?.role] || 'badge'}>
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
            </span>
          </div>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          {user?.bio && (
            <p className="text-gray-600 text-sm mt-2 line-clamp-2">{user.bio}</p>
          )}
        </div>

        <Link to="/profile" className="btn-secondary shrink-0 hidden sm:flex">
          Edit Profile
        </Link>
      </div>

      {/* Stats */}
      <div className={`grid gap-4 ${user?.role === 'freelancer' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'}`}>
        {loading
          ? displayStats.map((stat) => (
              <div key={stat.label} className="card animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-gray-100 mb-3" />
                <div className="h-7 bg-gray-100 rounded w-12 mb-1" />
                <div className="h-3 bg-gray-100 rounded w-20" />
              </div>
            ))
          : displayStats.map((stat) => (
              <div key={stat.label} className="card">
                <div
                  className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center text-xl mb-3`}
                >
                  {stat.icon}
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
      </div>

      {/* Quick actions */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className={`w-9 h-9 rounded-lg ${action.bg} flex items-center justify-center`}>
                {action.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{action.label}</p>
                <p className="text-xs text-gray-500">{action.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Skills preview */}
      {user?.skills && user.skills.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Your Skills</h2>
          <div className="flex flex-wrap gap-2">
            {user.skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
