import { create } from 'zustand';
import { login as loginApi } from '../api/auth';
import { cache } from '../utils/cache';
import { CACHE_KEYS } from '../utils/constants';
import { logger } from '../utils/logger';

const useAuthStore = create((set) => ({
  token: cache.get(CACHE_KEYS.TOKEN) || null,
  user: cache.get(CACHE_KEYS.USER) || null,
  loading: false,
  error: null,

  login: async (email, password, keyPass) => {
    set({ loading: true, error: null });
    try {
      const res = await loginApi(email, password, keyPass);
      const payload = res?.data?.data || res?.data || res;
      const token = payload?.token?.token || payload?.token;
      const user = payload?.user;

      cache.set(CACHE_KEYS.TOKEN, token);
      cache.set(CACHE_KEYS.USER, user);

      set({ token, user, loading: false });
      logger.action('Login successful');
      return res;
    } catch (error) {
      set({ error: error.message, loading: false });
      logger.error('Login failed', { error: error.message });
      throw error;
    } finally {
      set((state) => (state.loading ? { loading: false } : state));
    }
  },

  logout: () => {
    cache.remove(CACHE_KEYS.TOKEN);
    cache.remove(CACHE_KEYS.USER);
    set({ token: null, user: null });
    logger.action('User logged out');
  },
}));

export default useAuthStore;
