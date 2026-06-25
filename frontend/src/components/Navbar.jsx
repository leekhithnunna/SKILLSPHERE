import { useSelector } from 'react-redux';

const roleBadgeClass = {
  client: 'badge-client',
  freelancer: 'badge-freelancer',
  admin: 'badge-admin',
};

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Logo / App Name (visible on mobile) */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-7 h-7 rounded-md bg-primary-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">SS</span>
          </div>
          <span className="text-base font-bold text-gray-900">SkillSphere</span>
        </div>

        {/* Desktop placeholder to push user info right */}
        <div className="hidden md:block" />

        {/* Right: User info */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-primary-100"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center ring-2 ring-primary-100">
                <span className="text-primary-700 font-semibold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>

          {/* Name & role */}
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-semibold text-gray-900 leading-tight">
              {user?.name || 'User'}
            </span>
            <span className={roleBadgeClass[user?.role] || 'badge'}>
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
