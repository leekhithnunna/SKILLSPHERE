import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import userService from '../services/userService';
import resolveFileUrl from '../utils/resolveFileUrl';

const FindFreelancersPage = () => {
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({ skill: '', city: '', country: '', rateMin: '', rateMax: '', minRating: '', minExperience: '' });
  const [appliedFilters, setAppliedFilters] = useState({});

  const fetchFreelancers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, ...appliedFilters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await userService.searchFreelancers(params);
      setFreelancers(data.data);
      setPages(data.pages);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, appliedFilters]);

  useEffect(() => {
    fetchFreelancers();
  }, [fetchFreelancers]);

  const handleChange = (e) => setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const handleClear = () => {
    const empty = { skill: '', city: '', country: '', rateMin: '', rateMax: '', minRating: '', minExperience: '' };
    setFilters(empty);
    setAppliedFilters({});
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Find Freelancers</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} freelancers matching your filters</p>
      </div>

      <form onSubmit={handleSearch} className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input name="skill" value={filters.skill} onChange={handleChange} className="form-input" placeholder="Skill (e.g. React)" />
          <input name="city" value={filters.city} onChange={handleChange} className="form-input" placeholder="City" />
          <input name="country" value={filters.country} onChange={handleChange} className="form-input" placeholder="Country" />
          <select name="minRating" value={filters.minRating} onChange={handleChange} className="form-input">
            <option value="">Any Rating</option>
            <option value="4.5">4.5+ stars</option>
            <option value="4">4+ stars</option>
            <option value="3">3+ stars</option>
          </select>
          <input name="rateMin" type="number" min="0" value={filters.rateMin} onChange={handleChange} className="form-input" placeholder="Min $/hr" />
          <input name="rateMax" type="number" min="0" value={filters.rateMax} onChange={handleChange} className="form-input" placeholder="Max $/hr" />
          <select name="minExperience" value={filters.minExperience} onChange={handleChange} className="form-input">
            <option value="">Any Experience</option>
            <option value="1">1+ completed reviews</option>
            <option value="5">5+ completed reviews</option>
            <option value="10">10+ completed reviews</option>
          </select>
        </div>
        <div className="flex gap-2 mt-3">
          <button type="submit" className="btn-primary">Search</button>
          <button type="button" onClick={handleClear} className="btn-secondary">Clear</button>
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : freelancers.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 text-lg mb-2">No freelancers found</p>
          <p className="text-gray-400 text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {freelancers.map((f) => (
            <Link key={f._id} to={`/users/${f._id}`} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                {f.profileImage ? (
                  <img src={resolveFileUrl(f.profileImage)} alt={f.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 font-bold">{f.name?.charAt(0)?.toUpperCase()}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{f.name}</p>
                  {f.location?.city && <p className="text-xs text-gray-400">{[f.location.city, f.location.country].filter(Boolean).join(', ')}</p>}
                </div>
              </div>
              {f.reviewCount > 0 && (
                <p className="text-xs text-gray-500 mb-2">★ {f.reputationScore} ({f.reviewCount} reviews)</p>
              )}
              {f.freelancerProfile?.hourlyRate && (
                <p className="text-sm text-primary-600 font-semibold mb-2">${f.freelancerProfile.hourlyRate}/hr</p>
              )}
              {f.bio && <p className="text-sm text-gray-500 line-clamp-2">{f.bio}</p>}
              {f.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {f.skills.slice(0, 4).map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs">{s}</span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">
            Previous
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                page === p ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default FindFreelancersPage;
