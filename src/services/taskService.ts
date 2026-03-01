import { apiService } from './api';
import type { Task, TaskFiltersType } from '@/types';

// Параметры для постраничной загрузки (для будущей пагинации).
// json-server: GET /tasks?_page=1&_limit=20
export interface GetTasksParams {
  page?: number;
  limit?: number;
}

// Элемент дельты порядка: только id и новый order (индекс)
export interface OrderDeltaItem {
  id: number;
  order: number;
}

export interface PageDataType {
  page: number;
  limit: number;
  total: number;
  next: boolean;
  prev: boolean;
  totalEntries: number;
}

interface GetTasksResponseType {
  data: Task[];
  pageData: PageDataType;
}

export const taskService = {
  async getTasks(params?: GetTasksParams): Promise<GetTasksResponseType> {
    const search = new URLSearchParams();

    if (params?.page != null) search.set('_page', String(params.page));
    if (params?.limit != null) search.set('_limit', String(params.limit));

    const query = search.toString();
    const url = query ? `/tasks?${query}` : '/tasks';

    return apiService.get<GetTasksResponseType>(url);
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
   * PATCH /tasks/order — дельта порядка после drag-drop.
   * Тело: { orders: [{ id, order }, ...] } — только задачи, у которых изменился order. Минимум трафика при тысячах записей.
   */
  async updateTasksOrderDelta(orders: OrderDeltaItem[]): Promise<void> {
    if (orders.length === 0) return;
    await apiService.patch('/tasks/order', { orders });
  },
  async getFilters(): Promise<TaskFiltersType> {
    return await apiService.get<TaskFiltersType>('/filters');
  },
  async applyFilters(newFilters: Partial<TaskFiltersType>): Promise<TaskFiltersType> {
    return await apiService.put<TaskFiltersType>('/filters/apply', newFilters);
  },
};
