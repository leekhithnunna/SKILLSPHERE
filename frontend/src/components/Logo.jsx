/**
 * SkillSphere logomark — an orbiting node motif (skills connecting around
 * a central sphere). Plain vector icon, not a photo — no third-party asset.
 */
const Logo = ({ className = 'w-9 h-9' }) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="40" height="40" rx="11" fill="url(#skillsphere-logo-gradient)" />
    <circle cx="20" cy="20" r="6" fill="white" />
    <circle cx="20" cy="8" r="3" fill="white" fillOpacity="0.95" />
    <circle cx="31" cy="26" r="3" fill="white" fillOpacity="0.95" />
    <circle cx="9" cy="26" r="3" fill="white" fillOpacity="0.95" />
    <path
      d="M20 11v3.6M28.4 24.3l-3.1-2M11.6 24.3l3.1-2"
      stroke="white"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="skillsphere-logo-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0ea5e9" />
        <stop offset="1" stopColor="#7c3aed" />
      </linearGradient>
    </defs>
  </svg>
);

export default Logo;
