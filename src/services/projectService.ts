import { apiService } from './api';
import type { Project } from '@/types';

export const projectService = {
  async getProjects(): Promise<Project[]> {
    return apiService.get<Project[]>('/projects');
  },
};
