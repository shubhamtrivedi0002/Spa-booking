export const BASE_URL = import.meta.env.VITE_BASE_URL;
export const API_BASE = `${BASE_URL}/api/v1`;

export const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;
export const OUTLET_ID = import.meta.env.VITE_OUTLET_ID;
export const OUTLET_TYPE = import.meta.env.VITE_OUTLET_TYPE;
export const PANEL = import.meta.env.VITE_PANEL;

export const GENDER_COLORS = {
  female: '#EC4899',
  male: '#3B82F6',
};

export const BOOKING_STATUSES = {
  CONFIRMED: 'Confirmed',
  CHECK_IN: 'Check-in (In Progress)',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const BOOKING_SOURCES = ['Walk-in', 'WhatsApp', 'By Phone'];

export const TIME_SLOT_HEIGHT = 20;
export const THERAPIST_COLUMN_WIDTH = 160;
export const TIME_COLUMN_WIDTH = 64;
export const SLOT_INTERVAL = 15;

export const CACHE_KEYS = {
  TOKEN: 'spa_token',
  USER: 'spa_user',
  BOOKINGS: 'spa_bookings',
  THERAPISTS: 'spa_therapists',
  SERVICES: 'spa_services',
};
