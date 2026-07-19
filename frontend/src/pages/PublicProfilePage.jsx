import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import userService from '../services/userService';
import reviewService from '../services/reviewService';
import chatService from '../services/chatService';
import bookingService from '../services/bookingService';
import resolveFileUrl from '../utils/resolveFileUrl';

const StarRow = ({ value }) => (
  <span className="text-yellow-400 text-sm">
    {'★'.repeat(Math.round(value))}
    <span className="text-gray-200">{'★'.repeat(5 - Math.round(value))}</span>
  </span>
);

const PublicProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);

  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [bookingDate, setBookingDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingSlot, setBookingSlot] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, reviewsRes] = await Promise.all([
          userService.getPublicProfile(id),
          reviewService.getReviewsForUser(id),
        ]);
        setProfile(profileRes.data.user);
        setReviews(reviewsRes.data.data);
        setStats(reviewsRes.data.stats);
      } catch {
        setError('Profile not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleMessage = async () => {
    const { data } = await chatService.getOrCreateConversation(id);
    navigate(`/messages/${data.data._id}`);
  };

  const handleDateChange = async (e) => {
    const date = e.target.value;
    setBookingDate(date);
    setBookingMessage('');
    if (!date) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    try {
      const { data } = await bookingService.getAvailability(id, date);
      setSlots(data.data);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleBookSlot = async (slot) => {
    setBookingSlot(slot.startTime);
    setBookingMessage('');
    try {
      await bookingService.createBooking({
        freelancerId: id,
        date: bookingDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
      setBookingMessage(`Booked ${slot.startTime}–${slot.endTime} on ${bookingDate}`);
      setSlots((prev) => prev.map((s) => (s.startTime === slot.startTime ? { ...s, available: false } : s)));
    } catch (err) {
      setBookingMessage(err.response?.data?.message || 'Failed to book that slot.');
    } finally {
      setBookingSlot(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <svg className="animate-spin w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="card text-center py-16">
        <p className="text-gray-500 mb-4">{error || 'Profile not found'}</p>
        <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
      </div>
    );
  }

  const fp = profile.freelancerProfile || {};

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="card">
        <div className="flex items-start gap-5">
          {profile.profileImage ? (
            <img src={resolveFileUrl(profile.profileImage)} alt={profile.name} className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 font-bold text-2xl">{profile.name?.charAt(0)?.toUpperCase()}</span>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-gray-900">{profile.name}</h1>
              {fp.isVerifiedBadge && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                  ✓ Verified
                </span>
              )}
            </div>
            {profile.location?.city && (
              <p className="text-sm text-gray-500">{[profile.location.city, profile.location.country].filter(Boolean).join(', ')}</p>
            )}
            {stats && stats.reviewCount > 0 && (
              <div className="flex items-center gap-2 mt-1.5">
                <StarRow value={stats.reputationScore} />
                <span className="text-sm text-gray-500">
                  {stats.reputationScore} ({stats.reviewCount} review{stats.reviewCount !== 1 ? 's' : ''})
                </span>
              </div>
            )}
            {fp.hourlyRate && (
              <p className="text-sm text-primary-600 font-semibold mt-1">${fp.hourlyRate}/hr</p>
            )}
          </div>
          {currentUser && currentUser._id !== id && (
            <button onClick={handleMessage} className="btn-secondary shrink-0">Message</button>
          )}
        </div>

        {profile.bio && <p className="text-sm text-gray-600 mt-4">{profile.bio}</p>}

        {(profile.skills?.length > 0 || fp.skillProficiencies?.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {(fp.skillProficiencies?.length > 0
              ? fp.skillProficiencies.map((s) => `${s.skill} (${s.level})`)
              : profile.skills
            ).map((skill) => (
              <span key={skill} className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {currentUser?.role === 'client' && profile.role === 'freelancer' && (fp.weeklyAvailability?.some((a) => a.hours > 0)) && (
        <div className="card">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Book a Slot</h2>
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={bookingDate}
            onChange={handleDateChange}
            className="form-input w-48"
          />
          {slotsLoading && <p className="text-xs text-gray-400 mt-2">Loading availability…</p>}
          {!slotsLoading && bookingDate && slots.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">Not available on this day.</p>
          )}
          {slots.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {slots.map((s) => (
                <button
                  key={s.startTime}
                  onClick={() => handleBookSlot(s)}
                  disabled={!s.available || bookingSlot === s.startTime}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                    s.available
                      ? 'border-primary-200 text-primary-700 hover:bg-primary-50'
                      : 'border-gray-100 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {s.startTime}
                </button>
              ))}
            </div>
          )}
          {bookingMessage && <p className="text-xs text-gray-500 mt-2">{bookingMessage}</p>}
        </div>
      )}

      {fp.portfolio?.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Portfolio</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {fp.portfolio.map((item) => (
              <div key={item._id} className="border border-gray-100 rounded-lg overflow-hidden">
                {item.imageUrl ? (
                  <img src={resolveFileUrl(item.imageUrl)} alt={item.title} className="w-full h-24 object-cover" />
                ) : (
                  <div className="w-full h-24 bg-gray-50" />
                )}
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-900 truncate">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {fp.experience?.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Experience</h2>
          <div className="space-y-3">
            {fp.experience.map((exp, idx) => (
              <div key={idx}>
                <p className="text-sm font-semibold text-gray-900">{exp.title} {exp.company && `· ${exp.company}`}</p>
                {exp.description && <p className="text-xs text-gray-500">{exp.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Reviews</h2>

        {stats && stats.reviewCount > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-center">
            {Object.entries(stats.breakdown).map(([key, value]) => (
              <div key={key} className="p-2 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-400 capitalize">{key}</p>
                <p className="text-sm font-semibold text-gray-900">{value ?? '—'}</p>
              </div>
            ))}
          </div>
        )}

        {reviews.length === 0 ? (
          <p className="text-gray-400 text-sm italic">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r._id} className="pb-4 border-b border-gray-100 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{r.reviewer?.name}</span>
                  <StarRow value={r.rating} />
                </div>
                <p className="text-xs text-gray-400 mb-1">on "{r.gig?.title}"</p>
                {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfilePage;
