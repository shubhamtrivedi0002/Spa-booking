import { create } from 'zustand';
import * as bookingApi from '../api/bookings';
import { cache } from '../utils/cache';
import { CACHE_KEYS } from '../utils/constants';
import { logger } from '../utils/logger';

const CACHE_TTL = 5 * 60 * 1000;

const useBookingStore = create((set, get) => ({
  bookings: cache.get(CACHE_KEYS.BOOKINGS) || [],
  selectedBooking: null,
  bookingDetails: null,
  loading: false,
  error: null,
  dateRange: null,

  fetchBookings: async (daterange) => {
    set({ loading: true, error: null, dateRange: daterange });
    try {
      const data = await bookingApi.fetchBookings(daterange);
      const bookings = data?.data?.data?.list?.bookings || data?.data?.data || data?.data || [];
      cache.set(CACHE_KEYS.BOOKINGS, bookings, CACHE_TTL);
      set({ bookings, loading: false });
      logger.info(`Fetched ${bookings.length} bookings`);
      return bookings;
    } catch (error) {
      const cached = cache.get(CACHE_KEYS.BOOKINGS);
      set({ bookings: cached || [], error: error.message, loading: false });
      throw error;
    }
  },

  fetchBookingDetails: async (id) => {
    try {
      const data = await bookingApi.fetchBookingDetails(id);
      const bookings = data?.data?.data?.booking?.bookings;
      const details = Array.isArray(bookings) ? bookings[0] : (data?.data?.data || data?.data || data);
      set({ bookingDetails: details });
      return details;
    } catch (error) {
      logger.error('Failed to fetch booking details', { id, error: error.message });
      throw error;
    }
  },

  createBooking: async (bookingData) => {
    try {
      const data = await bookingApi.createBooking(bookingData);
      logger.action('Booking created', { data });
      // Background refresh — don't block UI
      const { dateRange, fetchBookings } = get();
      if (dateRange) fetchBookings(dateRange).catch(() => {});
      return data;
    } catch (error) {
      logger.error('Failed to create booking', { error: error.message });
      throw error;
    }
  },

  updateBooking: async (id, bookingData) => {
    // Optimistic: update selectedBooking immediately
    const prev = get().bookingDetails;
    if (prev) {
      set({ bookingDetails: { ...prev, ...bookingData } });
    }
    try {
      const data = await bookingApi.updateBooking(id, bookingData);
      logger.action('Booking updated', { id });
      // Background refresh
      const { dateRange, fetchBookings } = get();
      if (dateRange) fetchBookings(dateRange).catch(() => {});
      return data;
    } catch (error) {
      // Rollback on failure
      if (prev) set({ bookingDetails: prev });
      logger.error('Failed to update booking', { id, error: error.message });
      throw error;
    }
  },

  updateBookingStatus: async (id, status) => {
    // Optimistic: update status in local bookings list instantly
    const prevBookings = get().bookings;
    const prevDetails = get().bookingDetails;
    set({
      bookings: prevBookings.map((b) => (b.id === id ? { ...b, status } : b)),
      bookingDetails: prevDetails && prevDetails.id === id ? { ...prevDetails, status } : prevDetails,
    });
    try {
      const data = await bookingApi.updateBookingStatus(id, status);
      logger.action('Booking status updated', { id, status });
      // Background refresh for full data sync
      const { dateRange, fetchBookings } = get();
      if (dateRange) fetchBookings(dateRange).catch(() => {});
      return data;
    } catch (error) {
      // Rollback
      set({ bookings: prevBookings, bookingDetails: prevDetails });
      logger.error('Failed to update booking status', { error: error.message });
      throw error;
    }
  },

  cancelBooking: async (id, type = 'normal') => {
    // Optimistic: mark as cancelled immediately
    const prevBookings = get().bookings;
    set({ bookings: prevBookings.map((b) => (b.id === id ? { ...b, status: 'Cancelled' } : b)) });
    try {
      const data = await bookingApi.cancelBooking(id, type);
      logger.action('Booking cancelled', { id, type });
      const { dateRange, fetchBookings } = get();
      if (dateRange) fetchBookings(dateRange).catch(() => {});
      return data;
    } catch (error) {
      set({ bookings: prevBookings });
      logger.error('Failed to cancel booking', { error: error.message });
      throw error;
    }
  },

  deleteBooking: async (id) => {
    // Optimistic: remove from list immediately
    const prevBookings = get().bookings;
    set({ bookings: prevBookings.filter((b) => b.id !== id) });
    try {
      const data = await bookingApi.deleteBooking(id);
      logger.action('Booking deleted', { id });
      const { dateRange, fetchBookings } = get();
      if (dateRange) fetchBookings(dateRange).catch(() => {});
      return data;
    } catch (error) {
      set({ bookings: prevBookings });
      logger.error('Failed to delete booking', { error: error.message });
      throw error;
    }
  },

  setSelectedBooking: (booking) => set({ selectedBooking: booking }),
  clearSelectedBooking: () => set({ selectedBooking: null, bookingDetails: null }),
  clearError: () => set({ error: null }),
}));

export default useBookingStore;
