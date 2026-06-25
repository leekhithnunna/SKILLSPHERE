import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const roleBadgeClass = {
  client: 'badge-client',
  freelancer: 'badge-freelancer',
  admin: 'badge-admin',
};

const DashboardPage = () => {
  const { user } = useSelector((state) => state.auth);

  const stats = [
    { label: 'Active Projects', value: '0', icon: '📋', color: 'bg-blue-50 text-blue-600' },
    { label: 'Completed', value: '0', icon: '✅', color: 'bg-green-50 text-green-600' },
    { label: 'Total Earnings', value: '$0', icon: '💰', color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Reviews', value: '0', icon: '⭐', color: 'bg-violet-50 text-violet-600' },
  ];

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center text-xl mb-3`}>
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
          <Link
            to="/profile"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Update Profile</p>
              <p className="text-xs text-gray-500">Add skills &amp; bio</p>
            </div>
          </Link>

          <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 opacity-60 cursor-not-allowed">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Browse Jobs</p>
              <p className="text-xs text-gray-500">Coming in Week 2</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 opacity-60 cursor-not-allowed">
            <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Messages</p>
              <p className="text-xs text-gray-500">Coming in Week 2</p>
            </div>
          </div>
        </div>
      </div>

      {/* Skills preview */}
      {user?.skills && user.skills.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Your Skills</h2>
          <div className="flex flex-wrap gap-2">
            {user.skills.map((skill) => (
              <span key={skill} className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
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
