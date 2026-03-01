import type { TaskTableColumn } from '@/types/table';
import type { Task } from '@/types';
import { WORK_TYPE_LABELS } from '@/types';
import { MOCK_USERS } from '@/utils/constants';

export function useTaskTable() {
  const getUserInitials = (userId: number) => {
    const user = MOCK_USERS.find((u) => u.id === userId);
    return user
      ? user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
      : '?';
  };

  const getUserName = (userId: number) => {
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user) return;
    return user.name;
  };

  const columns: TaskTableColumn[] = [
    {
      name: 'id',
      label: 'ID задачи',
      field: 'id',
      align: 'left' as const,
      sortable: false,
    },
    {
      name: 'name',
      label: 'Название задачи',
      field: 'name',
      align: 'left' as const,
      sortable: true,
    },
    {
      name: 'project',
      label: 'Проект',
      field: (row: Task) => getProjectName(row.projectId),
      align: 'left' as const,
      sortable: true,
    },
    {
      name: 'workType',
      label: 'Тип работы',
      field: (row: Task) => WORK_TYPE_LABELS[row.workType],
      align: 'left' as const,
      sortable: true,
    },
    {
      name: 'assignees',
      label: 'Исполнители',
      field: (row: Task) => row.assignees,
      align: 'left' as const,
    },
    {
      name: 'hours',
      label: 'Часы (факт/план)',
      field: (row: Task) => `${row.actualHours} / ${row.plannedHours}`,
      align: 'center' as const,
      sortable: true,
      sort: (a: string, b: string, rowA: Task, rowB: Task) => {
        return rowA.plannedHours - rowB.plannedHours;
      },
    },
    {
      name: 'status',
      label: 'Статус',
      field: 'status',
      align: 'center' as const,
      sortable: true,
    },
    {
      name: 'priority',
      label: 'Приоритет',
      field: 'priority',
      align: 'left' as const,
      sortable: true,
    },
    {
      name: 'dates',
      label: 'Сроки',
      field: (row: Task) => `${formatDate(row.startDate)} - ${formatDate(row.endDate)}`,
      align: 'center' as const,
      sortable: true,
      sort: (a: string, b: string, rowA: Task, rowB: Task) => {
        const dateA = new Date(rowA.startDate).getTime();
        const dateB = new Date(rowB.startDate).getTime();
        return dateA - dateB;
      },
    },
    {
      name: 'actions',
      label: 'Действия',
      field: () => 'actions',
      align: 'center' as const,
    },
  ];

  const getProjectName = (projectId: number): string => {
    const projects: Record<number, string> = {
      1: 'Рекламный ролик Nike',
      2: 'Клип "Лето"',
      3: 'Корпоративный фильм',
      4: 'Сериал "Город"',
    };
    return projects[projectId] || `Проект ${projectId}`;
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('ru-RU');
  };

  return {
    columns,
    getUserInitials,
    getUserName,
    getProjectName,
    formatDate,
  };
}
