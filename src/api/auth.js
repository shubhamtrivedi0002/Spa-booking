import { API_BASE } from '../utils/constants';
import { logger } from '../utils/logger';

export async function login(email, password, keyPass) {
  const formData = new FormData();
  formData.append('email', email);
  formData.append('password', password);
  formData.append('key_pass', keyPass);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let response;
  try {
    response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error('Login request timed out. Please try again.');
    }
    throw error;
  }
  clearTimeout(timeout);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    logger.error('Login failed', err);
    throw new Error(err.message || 'Login failed');
  }

  const data = await response.json();
  logger.action('User logged in');
  return data;
}
