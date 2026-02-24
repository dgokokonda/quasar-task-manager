import { apiService } from './api';
import type { User } from '@/types';

export const userService = {
  async getUsers(): Promise<User[]> {
    return apiService.get<User[]>('/users');
  },
};
