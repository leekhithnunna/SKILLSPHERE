import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-violet-50">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">SS</span>
          </div>
          <span className="text-xl font-bold text-gray-900">SkillSphere</span>
        </div>

        <nav className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Sign In
          </Link>
          <Link to="/register" className="btn-primary">
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-32 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold uppercase tracking-wide mb-6">
          ✦ AI-Powered Marketplace
        </span>

        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Where Skills Meet
          <span className="text-primary-600"> Opportunity</span>
        </h1>

        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          SkillSphere connects talented freelancers with clients who need expert help.
          Find work, hire talent, and grow — all in one place.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/register?role=client" className="btn-primary px-8 py-3 text-base">
            Hire a Freelancer
          </Link>
          <Link to="/register?role=freelancer" className="btn-secondary px-8 py-3 text-base">
            Find Work
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: '🤖',
            title: 'AI-Powered Matching',
            desc: 'Smart algorithms connect the right talent with the right projects.',
          },
          {
            icon: '🔒',
            title: 'Secure Payments',
            desc: 'Milestone-based escrow keeps both parties protected.',
          },
          {
            icon: '⭐',
            title: 'Verified Talent',
            desc: 'Every freelancer is reviewed and skill-verified.',
          },
        ].map((feature) => (
          <div key={feature.title} className="card text-center hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">{feature.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default HomePage;
