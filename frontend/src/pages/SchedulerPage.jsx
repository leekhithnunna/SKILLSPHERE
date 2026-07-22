import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import bookingService from '../services/bookingService';
import BookingCalendar from '../components/BookingCalendar';
import BookingDetailModal from '../components/BookingDetailModal';

const SchedulerPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      const { data } = await bookingService.getMyBookings();
      setBookings(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    setCancellingId(id);
    try {
      await bookingService.cancelBooking(id);
      setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status: 'cancelled' } : b)));
      setSelectedBooking((prev) => (prev && prev._id === id ? { ...prev, status: 'cancelled' } : prev));
    } finally {
      setCancellingId(null);
    }
  };

  // Calendar events need a display name regardless of viewer role — show
  // whichever party isn't the person looking at the calendar.
  const calendarBookings = bookings.map((b) => ({
    ...b,
    counterpartName: (user?.role === 'freelancer' ? b.client : b.freelancer)?.name || 'Unknown',
  }));

  const upcoming = bookings.filter((b) => b.status === 'confirmed' && new Date(b.date) >= new Date().setHours(0, 0, 0, 0));
  const past = bookings.filter((b) => !(b.status === 'confirmed' && new Date(b.date) >= new Date().setHours(0, 0, 0, 0)));

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

  const renderBooking = (b) => {
    const counterpart = user.role === 'freelancer' ? b.client : b.freelancer;
    return (
      <div key={b._id} className="card flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {new Date(b.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {b.startTime}–{b.endTime}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">With {counterpart?.name}{b.gig?.title && ` · ${b.gig.title}`}</p>
          {b.notes && <p className="text-xs text-gray-400 mt-1">{b.notes}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
          }`}>
            {b.status}
          </span>
          {b.status === 'confirmed' && (
            <button
              onClick={() => handleCancel(b._id)}
              disabled={cancellingId === b._id}
              className="text-xs text-red-600 hover:underline"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Scheduler</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {user?.role === 'freelancer' ? 'Bookings clients have scheduled with you' : 'Your booked calls with freelancers'}
        </p>
      </div>

      {user?.role === 'freelancer' && (
        <div className="p-3 rounded-lg bg-primary-50 border border-primary-100 text-xs text-primary-700">
          Set your weekly availability hours in{' '}
          <a href="/freelancer-profile" className="underline font-medium">Professional Profile</a> — clients can then book from a freelancer's public profile page.
        </div>
      )}

      <BookingCalendar bookings={calendarBookings} onSelectBooking={setSelectedBooking} />

      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">Upcoming</h2>
          {upcoming.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No upcoming bookings.</p>
          ) : (
            <div className="space-y-2">{upcoming.map(renderBooking)}</div>
          )}
        </div>

        {past.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">Past &amp; Cancelled</h2>
            <div className="space-y-2">{past.map(renderBooking)}</div>
          </div>
        )}
      </div>

      <BookingDetailModal
        booking={selectedBooking}
        viewerRole={user?.role}
        onClose={() => setSelectedBooking(null)}
        onCancel={handleCancel}
        cancelling={!!selectedBooking && cancellingId === selectedBooking._id}
      />
    </div>
  );
};

export default SchedulerPage;
