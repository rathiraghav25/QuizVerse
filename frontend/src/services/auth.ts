import apiClient from './api';
import type { User, UserUpdatePayload } from '../types';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    return response.data;
  },

  signup: async (email: string, password: string, full_name: string, role: string): Promise<User> => {
    const response = await apiClient.post<User>('/auth/signup', { email, password, full_name, role });
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },

  updateMe: async (payload: UserUpdatePayload): Promise<User> => {
    const response = await apiClient.put<User>('/users/me', payload);
    return response.data;
  },
};
