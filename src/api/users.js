import { get, post } from './client';

export function fetchUsers(params = {}) {
  return get('/users', { pagination: 1, ...params });
}

export function fetchUserDetails(id) {
  return get(`/users/${id}`);
}

export function createUser(data) {
  return post('/users/create', data);
}
