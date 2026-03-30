import { API_BASE, CACHE_KEYS } from '../utils/constants';
import { cache } from '../utils/cache';
import { logger } from '../utils/logger';

async function apiClient(endpoint, options = {}) {
  const token = cache.get(CACHE_KEYS.TOKEN);
  const url = `${API_BASE}${endpoint}`;

  const headers = {
    Accept: 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = { ...options, headers };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    config.signal = controller.signal;

    const response = await fetch(url, config);
    clearTimeout(timeout);

    if (response.status === 401) {
      cache.remove(CACHE_KEYS.TOKEN);
      cache.remove(CACHE_KEYS.USER);
      window.location.reload();
      return;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `API Error: ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      logger.error(`API ${options.method || 'GET'} ${endpoint} failed`, {
        status: response.status,
        error: errorData,
      });
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      logger.error(`API ${options.method || 'GET'} ${endpoint} timeout`);
      throw new Error('Request timed out. Please try again.');
    }
    if (!error.status) {
      logger.error(`API ${options.method || 'GET'} ${endpoint} network error`, {
        message: error.message,
      });
    }
    throw error;
  }
}

export function get(endpoint, params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return apiClient(qs ? `${endpoint}?${qs}` : endpoint);
}

export function post(endpoint, data) {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }
  });
  return apiClient(endpoint, { method: 'POST', body: formData });
}

export function del(endpoint) {
  return apiClient(endpoint, { method: 'DELETE' });
}
