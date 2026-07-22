import { Link } from 'react-router-dom';

const statusBadge = {
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  completed: 'bg-gray-100 text-gray-500',
};

/**
 * Small popover-style modal with a single booking's details, opened by
 * clicking an event on BookingCalendar. Cancel reuses SchedulerPage's
 * existing cancel flow — there's no reschedule endpoint in the API, so we
 * point clients at the freelancer's profile to rebook instead of pretending
 * a reschedule action exists.
 */
const BookingDetailModal = ({ booking, viewerRole, onClose, onCancel, cancelling }) => {
  if (!booking) return null;

  const counterpart = viewerRole === 'freelancer' ? booking.client : booking.freelancer;
  const isUpcoming = booking.status === 'confirmed' && new Date(booking.date) >= new Date().setHours(0, 0, 0, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="card w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {counterpart?.profileImage ? (
              <img src={counterpart.profileImage} alt={counterpart.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <span className="text-primary-700 font-semibold text-sm">{counterpart?.name?.charAt(0)?.toUpperCase() || '?'}</span>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900">{counterpart?.name || 'Unknown'}</p>
              <p className="text-xs text-gray-400">{viewerRole === 'freelancer' ? 'Client' : 'Freelancer'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Date</span>
            <span className="font-medium text-gray-900">
              {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Time</span>
            <span className="font-medium text-gray-900">{booking.startTime}–{booking.endTime}</span>
          </div>
          {booking.gig?.title && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500 shrink-0">Gig</span>
              <Link to={`/gigs/${booking.gig._id}`} className="font-medium text-primary-600 hover:underline truncate">
                {booking.gig.title}
              </Link>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Status</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[booking.status] || 'bg-gray-100 text-gray-500'}`}>
              {booking.status}
            </span>
          </div>
          {booking.notes && (
            <div>
              <span className="text-gray-500 block mb-1">Notes</span>
              <p className="text-gray-700 bg-gray-50 rounded-lg p-2.5 text-sm">{booking.notes}</p>
            </div>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <Link to={`/users/${counterpart?._id}`} className="text-xs text-primary-600 hover:underline">
            View profile
          </Link>
          {isUpcoming && (
            <button
              onClick={() => onCancel(booking._id)}
              disabled={cancelling}
              className="text-xs text-red-600 hover:underline disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel booking'}
            </button>
          )}
        </div>

        {isUpcoming && viewerRole === 'client' && (
          <p className="text-[11px] text-gray-400 mt-2">
            Need a different time instead? Cancel this booking and pick a new slot from{' '}
            <Link to={`/users/${counterpart?._id}`} className="underline">
              {counterpart?.name}'s profile
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
};

export default BookingDetailModal;
