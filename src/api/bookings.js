import { get, post, del } from './client';
import { COMPANY_ID, OUTLET_ID, OUTLET_TYPE, PANEL } from '../utils/constants';

export function fetchBookings(daterange, params = {}) {
  return get('/bookings/outlet/booking/list', {
    pagination: 0,
    daterange,
    outlet: OUTLET_ID,
    panel: PANEL,
    view_type: 'calendar',
    ...params,
  });
}

export function fetchBookingDetails(id) {
  return get(`/bookings/booking-details/${id}`);
}

export function createBooking(data) {
  return post('/bookings/create', {
    company: COMPANY_ID,
    outlet: OUTLET_ID,
    outlet_type: OUTLET_TYPE,
    panel: PANEL,
    booking_type: '1',
    currency: 'SGD',
    payment_type: 'payatstore',
    membership: '0',
    type: 'manual',
    ...data,
  });
}

export function updateBooking(id, data) {
  return post(`/bookings/${id}`, {
    company: COMPANY_ID,
    outlet: OUTLET_ID,
    panel: PANEL,
    booking_type: '1',
    currency: 'SGD',
    membership: '0',
    ...data,
  });
}

export function updateBookingStatus(id, status) {
  return post('/bookings/update/payment-status', {
    company: COMPANY_ID,
    id: String(id),
    status,
    panel: PANEL,
    outlet_type: OUTLET_TYPE,
  });
}

export function cancelBooking(id, type = 'normal') {
  return post('/bookings/item/cancel', {
    company: COMPANY_ID,
    id: String(id),
    type,
    panel: PANEL,
  });
}

export function deleteBooking(id) {
  return del(`/bookings/destroy/${id}`);
}
