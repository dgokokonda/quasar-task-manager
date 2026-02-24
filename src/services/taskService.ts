import { apiService } from './api';
import type { Task } from '@/types';

// Параметры для постраничной загрузки (для будущей пагинации).
// json-server: GET /tasks?_page=1&_limit=20
export interface GetTasksParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export const taskService = {
  async getTasks(/*params?: GetTasksParams*/): Promise<Task[]> {
    const search = new URLSearchParams();
    // if (params?.page != null) search.set('_page', String(params.page));
    // if (params?.limit != null) search.set('_limit', String(params.limit));
    // if (params?.sort != null) search.set('_sort', params.sort);
    // if (params?.order != null) search.set('_order', params.order);
    const query = search.toString();
    const url = query ? `/tasks?${query}` : '/tasks';
    return apiService.get<Task[]>(url);
  },

  /** GET /tasks/:id — одна задача по id */
  async getTask(id: number): Promise<Task> {
    return apiService.get<Task>(`/tasks/${id}`);
  },

  /** POST /tasks — создание задачи */
  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    return apiService.post<Task>('/tasks', task);
  },

  /** PATCH /tasks/:id — частичное обновление. В теле только изменённые поля → минимальный размер запроса */
  async updateTask(id: number, updates: Partial<Task>): Promise<Task> {
    return apiService.patch<Task>(`/tasks/${id}`, updates);
  },

  /** DELETE /tasks/:id — удаление по id */
  async deleteTask(id: number): Promise<void> {
    await apiService.delete(`/tasks/${id}`);
  },

  /**
   * PUT /tasks — замена всего списка (после drag-drop).
   * Использовать только для смены порядка задач.
   */
  async updateTasksOrder(tasks: Task[]): Promise<Task[]> {
    return apiService.put<Task[]>('/tasks', tasks);
  },
};
