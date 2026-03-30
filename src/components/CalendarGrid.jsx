import { useState, useRef, useCallback, useMemo, useEffect, memo } from 'react';
import useBookingStore from '../store/bookingStore';
import useTherapistStore from '../store/therapistStore';
import useUiStore from '../store/uiStore';
import BookingBlock from './BookingBlock';
import { generateTimeSlots, groupBookingsByTherapist } from '../utils/helpers';
import {
  THERAPIST_COLUMN_WIDTH,
  TIME_COLUMN_WIDTH,
  TIME_SLOT_HEIGHT,
  SLOT_INTERVAL,
  GENDER_COLORS,
} from '../utils/constants';

const START_HOUR = 7;
const END_HOUR = 23;
const TIME_SLOTS = generateTimeSlots(START_HOUR, END_HOUR, SLOT_INTERVAL);
const TOTAL_HEIGHT = TIME_SLOTS.length * TIME_SLOT_HEIGHT;
const OVERSCAN = 3;

/* ---- Virtualized therapist column ---- */
const TherapistCol = memo(function TherapistCol({ bookings, colIdx, onBookingClick }) {
  return (
    <div
      className="therapist-column"
      style={{
        left: colIdx * THERAPIST_COLUMN_WIDTH,
        width: THERAPIST_COLUMN_WIDTH,
        height: TOTAL_HEIGHT,
      }}
    >
      {bookings.map((b) => (
        <BookingBlock
          key={`${b.id}-${b._item?.id || 0}`}
          booking={b}
          onClick={() => onBookingClick(b)}
        />
      ))}
    </div>
  );
});

/* ---- Main calendar grid ---- */
export default function CalendarGrid() {
  const bookings = useBookingStore((s) => s.bookings);
  const setSelectedBooking = useBookingStore((s) => s.setSelectedBooking);
  const therapists = useTherapistStore((s) => s.therapists);
  const searchQuery = useUiStore((s) => s.searchQuery);
  const filters = useUiStore((s) => s.filters);
  const openPanel = useUiStore((s) => s.openPanel);

  const scrollRef = useRef(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(1200);

  /* Filter therapists by search */
  const filteredTherapists = useMemo(() => {
    const list = Array.isArray(therapists) ? therapists : [];
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (t) =>
        (t.alias || t.name || '').toLowerCase().includes(q) ||
        (t.lastname || '').toLowerCase().includes(q) ||
        (t.code || '').toLowerCase().includes(q)
    );
  }, [therapists, searchQuery]);

  /* Filter bookings by status if filter set */
  const filteredBookings = useMemo(() => {
    const list = Array.isArray(bookings) ? bookings : [];
    if (!filters.status) return list;
    return list.filter((b) => b.status === filters.status);
  }, [bookings, filters.status]);

  /* Group bookings by therapist id for O(1) lookup */
  const bookingsByTherapist = useMemo(
    () => groupBookingsByTherapist(filteredBookings),
    [filteredBookings]
  );

  /* Horizontal virtualisation – only render visible columns */
  const totalWidth = filteredTherapists.length * THERAPIST_COLUMN_WIDTH;
  const startCol = Math.max(0, Math.floor(scrollLeft / THERAPIST_COLUMN_WIDTH) - OVERSCAN);
  const endCol = Math.min(
    filteredTherapists.length,
    Math.ceil((scrollLeft + viewportWidth) / THERAPIST_COLUMN_WIDTH) + OVERSCAN
  );

  const visibleCols = useMemo(
    () =>
      filteredTherapists.slice(startCol, endCol).map((t, i) => ({
        ...t,
        _colIdx: startCol + i,
      })),
    [filteredTherapists, startCol, endCol]
  );

  /* Scroll handler (passive) */
  const handleScroll = useCallback(() => {
    if (scrollRef.current) setScrollLeft(scrollRef.current.scrollLeft);
  }, []);

  /* ResizeObserver to track viewport width */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setViewportWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    setViewportWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  /* Booking click */
  const handleBookingClick = useCallback(
    (booking) => {
      setSelectedBooking(booking);
      openPanel('view');
    },
    [setSelectedBooking, openPanel]
  );

  /* Current-time line */
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowTop = ((nowMin - START_HOUR * 60) / SLOT_INTERVAL) * TIME_SLOT_HEIGHT;
  const showNow = nowMin >= START_HOUR * 60 && nowMin < END_HOUR * 60;

  return (
    <div className="calendar-wrapper" ref={scrollRef} onScroll={handleScroll}>
      <div
        className="calendar-inner"
        style={{ width: TIME_COLUMN_WIDTH + totalWidth, minWidth: '100%' }}
      >
        {/* ===== Header row ===== */}
        <div className="calendar-header-row">
          <div className="calendar-header-corner">Time</div>
          {filteredTherapists.map((t) => (
            <div key={t.id} className="therapist-header">
              <div
                className="therapist-gender-indicator"
                style={{ background: GENDER_COLORS[t.gender] || GENDER_COLORS.male }}
              />
              <div
                className="therapist-name"
                title={t.alias || t.name || `${t.name || ''} ${t.lastname || ''}`}
              >
                {t.alias || t.name || 'Unknown'}
              </div>
            </div>
          ))}
        </div>

        {/* ===== Body ===== */}
        <div className="calendar-body">
          {/* Time column (sticky left) */}
          <div className="time-column">
            {TIME_SLOTS.map((slot) => (
              <div
                key={slot.time}
                className={`time-slot-label${slot.minutes % 60 === 0 ? ' hour-mark' : ''}`}
              >
                {slot.minutes % 60 === 0 ? slot.time : ''}
              </div>
            ))}
          </div>

          {/* Columns area */}
          <div
            className="calendar-columns"
            style={{ width: totalWidth, height: TOTAL_HEIGHT }}
          >
            {/* Grid lines */}
            <div className="calendar-grid-bg">
              {TIME_SLOTS.map((slot) => (
                <div
                  key={slot.time}
                  className={`grid-line-h${slot.minutes % 60 === 0 ? ' hour-line' : ''}`}
                  style={{
                    top: ((slot.minutes - START_HOUR * 60) / SLOT_INTERVAL) * TIME_SLOT_HEIGHT,
                  }}
                />
              ))}
            </div>

            {/* Now indicator */}
            {showNow && <div className="now-line" style={{ top: nowTop }} />}

            {/* Virtualised therapist columns */}
            {visibleCols.map((t) => (
              <TherapistCol
                key={t.id}
                bookings={bookingsByTherapist.get(Number(t.therapist_id)) || bookingsByTherapist.get(Number(t.id)) || []}
                colIdx={t._colIdx}
                onBookingClick={handleBookingClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
