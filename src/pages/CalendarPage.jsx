import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import useAuthStore from '../store/authStore';
import useBookingStore from '../store/bookingStore';
import useTherapistStore from '../store/therapistStore';
import useServiceStore from '../store/serviceStore';
import useUiStore from '../store/uiStore';
import CalendarToolbar from '../components/CalendarToolbar';
import CalendarGrid from '../components/CalendarGrid';
import BookingPanel from '../components/BookingPanel';
import Loader from '../components/Loader';
import ErrorBoundary from '../components/ErrorBoundary';
import { formatDate } from '../utils/helpers';
import { logger } from '../utils/logger';

const NAV_TABS = ['Home', 'Therapists', 'Sales', 'Clients', 'Transactions', 'Reports'];

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [activeTab, setActiveTab] = useState('Home');
  const logout = useAuthStore((s) => s.logout);
  const fetchBookings = useBookingStore((s) => s.fetchBookings);
  const bookingsLoading = useBookingStore((s) => s.loading);
  const bookingsError = useBookingStore((s) => s.error);
  const clearError = useBookingStore((s) => s.clearError);
  const fetchTherapists = useTherapistStore((s) => s.fetchTherapists);
  const therapistsLoading = useTherapistStore((s) => s.loading);
  const fetchCategories = useServiceStore((s) => s.fetchCategories);
  const panelOpen = useUiStore((s) => s.panelOpen);

  const loadData = useCallback(
    async (date) => {
      const dateStr = formatDate(date, 'DD-MM-YYYY');
      const dateRange = `${dateStr} / ${dateStr}`;
      try {
        await Promise.all([
          fetchBookings(dateRange),
          fetchTherapists(),
          fetchCategories(),
        ]);
      } catch (error) {
        logger.error('Failed to load calendar data', { error: error.message });
      }
    },
    [fetchBookings, fetchTherapists, fetchCategories]
  );

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate, loadData]);

  const handleDateChange = useCallback((date) => {
    setSelectedDate(date);
  }, []);

  const isLoading = bookingsLoading || therapistsLoading;

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon"><em>Logo</em></span>
        </div>
        <div className="header-spacer" />
        <nav className="header-nav">
          {NAV_TABS.map((tab) => (
            <span
              key={tab}
              className={`nav-tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </span>
          ))}
        </nav>
        <div className="header-actions">
          <span className="header-avatar" title="Notifications">🔔</span>
          <span className="header-avatar" onClick={logout} title="Logout">👤</span>
        </div>
      </header>

      <CalendarToolbar selectedDate={selectedDate} onDateChange={handleDateChange} />

      {bookingsError && (
        <div className="error-bar">
          <span>{bookingsError}</span>
          <button className="btn btn-sm btn-secondary" onClick={() => loadData(selectedDate)}>
            Retry
          </button>
          <button className="btn btn-sm btn-ghost" onClick={clearError}>
            ×
          </button>
        </div>
      )}

      <div className={`app-main${panelOpen ? ' panel-open' : ''}`}>
        <div className="calendar-container">
          <ErrorBoundary>
            {isLoading && <Loader />}
            <CalendarGrid />
          </ErrorBoundary>
        </div>

        {panelOpen && (
          <ErrorBoundary>
            <BookingPanel />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}
