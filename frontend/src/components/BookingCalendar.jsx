import { useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './BookingCalendar.css';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: enUS }),
  getDay,
  locales,
});

/** Combines a booking's UTC-midnight `date` with a plain "HH:mm" time string
 * into a local Date — mirrors how the rest of the app already treats
 * startTime/endTime as plain wall-clock labels (no timezone conversion). */
const buildDateTime = (dateStr, timeStr) => {
  const d = new Date(dateStr);
  const [hours, minutes] = (timeStr || '00:00').split(':').map(Number);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hours, minutes);
};

const statusStyles = {
  confirmed: { backgroundColor: '#0284c7', borderColor: '#0369a1' }, // primary-600 / 700
  completed: { backgroundColor: '#16a34a', borderColor: '#15803d' }, // green-600 / 700
  cancelled: { backgroundColor: '#d1d5db', borderColor: '#9ca3af', color: '#4b5563' }, // gray-300/400/600
};

const EventItem = ({ event }) => (
  <div className="truncate leading-tight">
    <span className="font-medium">{event.counterpartName}</span>
    <span className="opacity-90"> · {event.timeLabel}</span>
  </div>
);

/**
 * Month/week/day calendar of a user's bookings. Renders the grid even with
 * zero events so the page never looks broken when there's no data yet.
 */
const BookingCalendar = ({ bookings, onSelectBooking }) => {
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());

  const events = useMemo(
    () =>
      bookings.map((b) => ({
        id: b._id,
        start: buildDateTime(b.date, b.startTime),
        end: buildDateTime(b.date, b.endTime),
        counterpartName: b.counterpartName,
        timeLabel: `${b.startTime}–${b.endTime}`,
        status: b.status,
        resource: b,
      })),
    [bookings]
  );

  return (
    <div className="card p-0 overflow-hidden">
      <div className="sched-calendar" style={{ height: 600 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          views={['month', 'week', 'day']}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          popup
          components={{ event: EventItem }}
          eventPropGetter={(event) => ({ style: statusStyles[event.status] || statusStyles.confirmed })}
          onSelectEvent={(event) => onSelectBooking(event.resource)}
        />
      </div>
    </div>
  );
};

export default BookingCalendar;
