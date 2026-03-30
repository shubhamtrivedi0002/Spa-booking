import { get } from './client';
import { OUTLET_ID, PANEL } from '../utils/constants';

export function fetchRooms(date, duration = 60) {
  return get(`/room-bookings/outlet/${OUTLET_ID}`, {
    date,
    panel: PANEL,
    duration: String(duration),
  });
}
