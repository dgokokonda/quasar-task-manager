import type { WorkType, TaskStatus, Project, User } from '@/types';

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  editing: 'Монтаж',
  color: 'Цветокоррекция',
  graphics: 'Графика',
  sound: 'Звук',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'Не начата',
  in_progress: 'В работе',
  on_hold: 'На паузе',
  completed: 'Завершена',
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: 'grey',
  in_progress: 'blue',
  on_hold: 'orange',
  completed: 'green',
};

export const MOCK_PROJECTS: Project[] = [
  { id: 1, name: 'Рекламный ролик Nike', code: 'NIKE-2024' },
  { id: 2, name: 'Клип "Лето"', code: 'MUSIC-001' },
  { id: 3, name: 'Корпоративный фильм', code: 'CORP-023' },
  { id: 4, name: 'Сериал "Город"', code: 'SER-056' },
];

export const MOCK_USERS: User[] = [
  { id: 1, name: 'Анна Петрова', role: 'Монтажер' },
  { id: 2, name: 'Иван Сидоров', role: 'Колорист' },
  { id: 3, name: 'Мария Иванова', role: 'Звукорежиссер' },
  { id: 4, name: 'Алексей Козлов', role: 'Motion-дизайнер' },
];
