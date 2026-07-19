import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import gigService from '../services/gigService';

const statusColors = {
  open: 'bg-green-100 text-green-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  completed: 'bg-gray-100 text-gray-600',
  closed: 'bg-red-100 text-red-600',
};

const BrowseGigsPage = () => {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    search: '',
    skill: '',
    budgetMin: '',
    budgetMax: '',
    status: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({});

  const fetchGigs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 9, ...appliedFilters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await gigService.getGigs(params);
      setGigs(data.data);
      setPages(data.pages);
      setTotal(data.total);
    } catch {
      setError('Failed to load gigs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, appliedFilters]);

  useEffect(() => {
    fetchGigs();
  }, [fetchGigs]);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const handleClear = () => {
    const empty = { search: '', skill: '', budgetMin: '', budgetMax: '', status: '' };
    setFilters(empty);
    setAppliedFilters({});
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Browse Gigs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} gigs available</p>
        </div>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            name="search"
            type="text"
            value={filters.search}
            onChange={handleFilterChange}
            className="form-input lg:col-span-2"
            placeholder="Search by title..."
          />
          <input
            name="skill"
            type="text"
            value={filters.skill}
            onChange={handleFilterChange}
            className="form-input"
            placeholder="Skill (e.g. React)"
          />
          <div className="flex gap-2">
            <input
              name="budgetMin"
              type="number"
              value={filters.budgetMin}
              onChange={handleFilterChange}
              className="form-input w-full"
              placeholder="Min $"
              min="0"
            />
            <input
              name="budgetMax"
              type="number"
              value={filters.budgetMax}
              onChange={handleFilterChange}
              className="form-input w-full"
              placeholder="Max $"
              min="0"
            />
          </div>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="form-input"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="flex gap-2 mt-3">
          <button type="submit" className="btn-primary">
            Search
          </button>
          <button type="button" onClick={handleClear} className="btn-secondary">
            Clear
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Gigs Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : gigs.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 text-lg mb-2">No gigs found</p>
          <p className="text-gray-400 text-sm">Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gigs.map((gig) => (
            <div key={gig._id} className="card flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    statusColors[gig.status] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {gig.status.charAt(0).toUpperCase() + gig.status.slice(1)}
                </span>
                <span className="text-lg font-bold text-primary-600">
                  {gig.budgetMin === gig.budgetMax ? `$${gig.budgetMin}` : `$${gig.budgetMin}–$${gig.budgetMax}`}
                </span>
              </div>

              <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                {gig.title}
              </h3>

              <p className="text-sm text-gray-500 line-clamp-3 flex-1 mb-4">
                {gig.description}
              </p>

              {gig.skillsRequired?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {gig.skillsRequired.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {gig.skillsRequired.length > 3 && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs">
                      +{gig.skillsRequired.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 text-xs font-semibold">
                      {gig.client?.name?.charAt(0)?.toUpperCase() || 'C'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{gig.client?.name}</span>
                </div>
                {gig.deadline && (
                  <span className="text-xs text-gray-400">
                    Due {new Date(gig.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>

              <Link
                to={`/gigs/${gig._id}`}
                className="btn-primary w-full mt-4 text-center"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
          >
            Previous
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                page === p
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default BrowseGigsPage;
