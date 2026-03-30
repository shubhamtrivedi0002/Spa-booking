import { get } from './client';
import { OUTLET_ID, OUTLET_TYPE, PANEL } from '../utils/constants';

export function fetchServiceCategories(params = {}) {
  return get('/service-category', {
    outlet_type: OUTLET_TYPE,
    outlet: OUTLET_ID,
    pagination: 0,
    panel: PANEL,
    ...params,
  });
}
