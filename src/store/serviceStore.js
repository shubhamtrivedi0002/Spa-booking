import { create } from 'zustand';
import { fetchServiceCategories } from '../api/services';
import { cache } from '../utils/cache';
import { CACHE_KEYS } from '../utils/constants';

const useServiceStore = create((set) => ({
  categories: cache.get(CACHE_KEYS.SERVICES) || [],
  loading: false,
  error: null,

  fetchCategories: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await fetchServiceCategories(params);
      const categories = data?.data?.data?.list?.category || data?.data?.data || data?.data || [];
      cache.set(CACHE_KEYS.SERVICES, categories, 10 * 60 * 1000);
      set({ categories, loading: false });
      return categories;
    } catch (error) {
      const cached = cache.get(CACHE_KEYS.SERVICES);
      set({ categories: cached || [], error: error.message, loading: false });
      throw error;
    } finally {
      set((state) => (state.loading ? { loading: false } : state));
    }
  },
}));

export default useServiceStore;
