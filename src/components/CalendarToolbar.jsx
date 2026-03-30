import { useCallback } from 'react';
import dayjs from 'dayjs';
import useUiStore from '../store/uiStore';
import useBookingStore from '../store/bookingStore';
import { BOOKING_STATUSES } from '../utils/constants';
import { debounce } from '../utils/helpers';

const debouncedSearch = debounce((fn, val) => fn(val), 300);

export default function CalendarToolbar({ selectedDate, onDateChange }) {
  const openPanel = useUiStore((s) => s.openPanel);
  const setSearchQuery = useUiStore((s) => s.setSearchQuery);
  const setFilters = useUiStore((s) => s.setFilters);
  const filters = useUiStore((s) => s.filters);
  const setSelectedBooking = useBookingStore((s) => s.setSelectedBooking);

  const handlePrev = useCallback(() => {
    onDateChange(dayjs(selectedDate).subtract(1, 'day'));
  }, [selectedDate, onDateChange]);

  const handleNext = useCallback(() => {
    onDateChange(dayjs(selectedDate).add(1, 'day'));
  }, [selectedDate, onDateChange]);

  const handleToday = useCallback(() => {
    onDateChange(dayjs());
  }, [onDateChange]);

  const handleSearch = useCallback(
    (e) => {
      debouncedSearch(setSearchQuery, e.target.value);
    },
    [setSearchQuery]
  );

  const handleNewBooking = useCallback(() => {
    setSelectedBooking(null);
    openPanel('create');
  }, [setSelectedBooking, openPanel]);

  return (
    <div className="calendar-toolbar">
      <div className="toolbar-left">
        <select className="filter-select">
          <option>Liat Towers</option>
        </select>
        <span className="toolbar-divider" />
        <span className="toolbar-label">Display :</span>
        <select className="filter-select">
          <option>15 Min</option>
          <option>30 Min</option>
          <option>60 Min</option>
        </select>
      </div>

      <div className="toolbar-center">
        <button className="btn btn-ghost btn-sm" onClick={handlePrev} title="Previous day">
          ◀
        </button>
        <span className="date-label">
          {dayjs(selectedDate).format('ddd, MMM D, YYYY')}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={handleNext} title="Next day">
          ▶
        </button>
        <button className="btn btn-secondary btn-sm" onClick={handleToday}>
          Today
        </button>
        <input
          type="date"
          className="toolbar-date-input"
          value={dayjs(selectedDate).format('YYYY-MM-DD')}
          onChange={(e) => onDateChange(dayjs(e.target.value))}
        />
      </div>

      <div className="toolbar-right">
        <div className="toolbar-search">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="phone/name" onChange={handleSearch} />
        </div>
        <span className="toolbar-tab">Appointment</span>
        <select
          className="filter-select"
          value={filters.status || ''}
          onChange={(e) => setFilters({ status: e.target.value })}
        >
          <option value="">All Statuses</option>
          {Object.values(BOOKING_STATUSES).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button className="btn btn-primary btn-sm" onClick={handleNewBooking}>
          + New Booking
        </button>
      </div>
    </div>
  );
}
