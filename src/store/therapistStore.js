import { create } from 'zustand';
import { fetchTherapists as fetchTherapistsApi, fetchTherapistTimings as fetchTimingsApi } from '../api/therapists';
import { cache } from '../utils/cache';
import { CACHE_KEYS } from '../utils/constants';
import { logger } from '../utils/logger';

const useTherapistStore = create((set) => ({
  therapists: cache.get(CACHE_KEYS.THERAPISTS) || [],
  timings: [],
  loading: false,
  error: null,

  fetchTherapists: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await fetchTherapistsApi(params);
      const therapists = data?.data?.data?.list?.staffs || data?.data?.data || data?.data || [];
      cache.set(CACHE_KEYS.THERAPISTS, therapists, 10 * 60 * 1000);
      set({ therapists, loading: false });
      logger.info(`Fetched ${therapists.length} therapists`);
      return therapists;
    } catch (error) {
      const cached = cache.get(CACHE_KEYS.THERAPISTS);
      set({ therapists: cached || [], error: error.message, loading: false });
      throw error;
    } finally {
      set((state) => (state.loading ? { loading: false } : state));
    }
  },

  fetchTimings: async (startDate, endDate) => {
    try {
      const data = await fetchTimingsApi(startDate, endDate);
      const timings = data?.data || [];
      set({ timings });
      return timings;
    } catch (error) {
      logger.error('Failed to fetch therapist timings', { error: error.message });
      throw error;
    }
  },
}));

export default useTherapistStore;
