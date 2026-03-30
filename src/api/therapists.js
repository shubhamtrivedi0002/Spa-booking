import { get } from './client';
import { OUTLET_ID, OUTLET_TYPE, PANEL } from '../utils/constants';

export function fetchTherapists(params = {}) {
  return get('/therapists', {
    status: '1',
    pagination: 0,
    panel: PANEL,
    outlet: OUTLET_ID,
    outlet_type: OUTLET_TYPE,
    leave: '0',
    ...params,
  });
}

export function fetchTherapistTimings(startDate, endDate) {
  return get('/therapist-timings', {
    start_date: startDate,
    end_date: endDate,
    outlet: OUTLET_ID,
  });
}
