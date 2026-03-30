import { memo, useMemo } from 'react';
import { getBookingTop, getBookingHeight } from '../utils/helpers';
import { TIME_SLOT_HEIGHT } from '../utils/constants';

function getStatusClass(status) {
  if (!status) return 'status-confirmed';
  const s = status.toLowerCase();
  if (s.includes('check') || s.includes('progress')) return 'status-checkin';
  if (s.includes('complete')) return 'status-completed';
  if (s.includes('cancel')) return 'status-cancelled';
  return 'status-confirmed';
}

const BookingBlock = memo(function BookingBlock({ booking, onClick }) {
  const item = booking._item || {};

  const style = useMemo(() => {
    const rawTime = item.start_time || '09:00';
    // API may return "HH:mm:ss", strip seconds
    const startTime = rawTime.length > 5 ? rawTime.substring(0, 5) : rawTime;
    const duration = item.duration || 60;
    const top = getBookingTop(startTime, TIME_SLOT_HEIGHT);
    const height = getBookingHeight(duration, TIME_SLOT_HEIGHT);
    return {
      top: `${top}px`,
      height: `${Math.max(height, TIME_SLOT_HEIGHT)}px`,
    };
  }, [item.start_time, item.duration]);

  const statusClass = getStatusClass(booking.status);
  // API item has `service` as string name directly, or service?.name
  const serviceName = typeof item.service === 'string' ? item.service : (item.service?.name || item.service_name || 'Service');
  // Customer is in booking.user, not booking.customer
  const clientName =
    booking.user?.name || booking.customer?.name || booking.customer_name || item.customer_name || '';
  const hasRequestedTherapist = item.requested_person === 1;
  const hasRequestedRoom = item.requested_room === 1;

  const startDisplay = item.start_time ? (item.start_time.length > 5 ? item.start_time.substring(0, 5) : item.start_time) : '—';
  const endDisplay = item.end_time ? (item.end_time.length > 5 ? item.end_time.substring(0, 5) : item.end_time) : '—';

  return (
    <div className={`booking-block ${statusClass}`} style={style} onClick={onClick}>
      <div className="booking-time">
        {startDisplay} – {endDisplay}
      </div>
      <div className="booking-service">{serviceName}</div>
      {clientName && <div className="booking-client">{clientName}</div>}
      <div className="booking-icons">
        {hasRequestedTherapist && <span className="icon-t" title="Requested Therapist">T</span>}
        {hasRequestedRoom && <span className="icon-r" title="Requested Room">R</span>}
      </div>
    </div>
  );
});

export default BookingBlock;
