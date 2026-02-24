export type WorkType = 'editing' | 'color' | 'graphics' | 'sound';
export type TaskStatus = 'not_started' | 'in_progress' | 'on_hold' | 'completed';

export interface Task {
  id: number;
  name: string;
  projectId: number;
  workType: WorkType;
  assignees: number[];
  plannedHours: number;
  actualHours: number;
  status: TaskStatus;
  startDate: string;
  endDate: string;
  description?: string;
  // Порядок в табличном списке для отображения после drag-drop задачи:
  order?: number;
}

export interface Project {
  id: number;
  name: string;
  code: string;
}

export interface User {
  id: number;
  name: string;
  role: string;
}

export interface TaskFilters {
  statuses: TaskStatus[];
  workType?: WorkType;
  assigneeId?: number;
  search: string;
  sortBy: 'order' | 'startDate' | 'endDate' | 'plannedHours' | 'actualHours';
  sortOrder: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  loading: boolean;
}

export interface TaskActions {
  create(): void;
  edit(id: number): void;
  changeStatus(id: number, status: string): void;
  remove(id: number): void;
}

export const STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: 'grey',
  in_progress: 'blue',
  on_hold: 'orange',
  completed: 'green',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'Не начата',
  in_progress: 'В работе',
  on_hold: 'На паузе',
  completed: 'Завершена',
};

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  editing: 'Монтаж',
  color: 'Цветокоррекция',
  graphics: 'Графика',
  sound: 'Звук',
};
