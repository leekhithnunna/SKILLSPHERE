import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import heroImage from '../assets/images/hero-teamwork.jpg';
import collabImage from '../assets/images/collab-laptop.jpg';
import handshakeImage from '../assets/images/handshake-deal.jpg';

const features = [
  {
    title: 'AI-Powered Matching',
    desc: 'Skill-similarity scoring and weighted reputation connect the right talent with the right project — automatically.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'Secure Escrow Payments',
    desc: 'Milestone-based payments are held in escrow and released only when work is approved — for both sides.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: 'Verified Talent',
    desc: 'Every freelancer builds a weighted reputation from real, verified reviews — with fraud detection built in.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Hyperlocal Discovery',
    desc: 'Location-aware search surfaces freelancers near you, alongside skill, rate, and rating filters.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const steps = [
  { label: '01', title: 'Post or browse', desc: 'Clients post a gig with a budget range; freelancers browse AI-matched recommendations.' },
  { label: '02', title: 'Propose & agree', desc: 'Freelancers bid, negotiate, and get hired — milestones are defined up front.' },
  { label: '03', title: 'Deliver & get paid', desc: 'Work happens in real time with chat and progress tracking; escrow releases on approval.' },
];

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo className="w-9 h-9" />
            <span className="text-lg font-bold text-gray-900">SkillSphere</span>
          </div>

          <nav className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-2">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold uppercase tracking-wide mb-6">
            AI-Powered Hyperlocal Marketplace
          </span>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-[1.1] mb-6">
            Where skills meet
            <span className="text-primary-600"> opportunity</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-lg mb-8 leading-relaxed">
            SkillSphere connects clients with verified local freelancers using AI-matched
            recommendations, milestone escrow, and real-time collaboration — all in one place.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <Link to="/register?role=client" className="btn-primary px-6 py-3 text-sm">
              Hire a Freelancer
            </Link>
            <Link to="/register?role=freelancer" className="btn-secondary px-6 py-3 text-sm">
              Find Work
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-tr from-primary-100 to-violet-100 rounded-3xl -z-10 hidden sm:block" />
          <img
            src={heroImage}
            alt="Freelancers and a client collaborating around a table"
            className="w-full h-80 sm:h-96 object-cover rounded-2xl shadow-lg"
          />
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-gray-100">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Built for how freelance work actually happens</h2>
          <p className="text-gray-500 text-sm">Every module — from matching to payments — works together, not as bolted-on add-ons.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="flex gap-4 p-5 rounded-xl border border-gray-100 hover:border-primary-100 hover:shadow-sm transition-all">
              <div className="w-11 h-11 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <img
            src={collabImage}
            alt="Freelancers working together on laptops"
            className="w-full h-72 object-cover rounded-2xl shadow-md order-2 lg:order-1"
          />

          <div className="order-1 lg:order-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">How it works</h2>
            <div className="space-y-6">
              {steps.map((step) => (
                <div key={step.label} className="flex gap-4">
                  <span className="text-sm font-bold text-primary-600 w-8 shrink-0">{step.label}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Deals that both sides can trust</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Escrow-backed milestones, admin-mediated disputes, and a weighted reputation score
            keep clients and freelancers accountable — so agreements hold up.
          </p>
          <Link to="/register" className="btn-primary px-6 py-3 text-sm inline-flex">
            Create your free account
          </Link>
        </div>
        <img
          src={handshakeImage}
          alt="Client and freelancer shaking hands on a deal"
          className="w-full h-72 object-cover rounded-2xl shadow-md"
        />
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Logo className="w-6 h-6" />
            <span className="text-sm font-semibold text-gray-700">SkillSphere</span>
          </div>
          <p className="text-xs text-gray-400">Built for the Nayoda Full Stack Development Internship</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
