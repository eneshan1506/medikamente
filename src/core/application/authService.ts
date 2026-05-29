import type { User } from '../domain/types';
import { api } from '../infrastructure/api';

export const authService = {
  me: () => api.get<User>('/auth/me'),
  login: (payload: { email: string; password: string }) => api.post<User>('/auth/login', payload),
  register: (payload: { email: string; password: string }) => api.post<User>('/auth/register', payload),
  logout: () => api.post<void>('/auth/logout'),
  updateTimezone: (timeZone: string) => api.post<User>('/auth/timezone', { timeZone })
};
