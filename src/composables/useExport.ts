import { unparse } from 'papaparse';
import type { Task, TaskPriority } from '@/types';
import { MOCK_USERS, MOCK_PROJECTS } from '@/utils/constants';
import { STATUS_LABELS, WORK_TYPE_LABELS, PRIORITY_LABELS } from '@/utils/constants';

export function useExport() {
  const formatTasksForExport = (tasks: Task[]) => {
    return tasks.map((task) => ({
      ID: task.id,
      'Название задачи': task.name,
      Проект: getProjectName(task.projectId),
      'Тип работы': WORK_TYPE_LABELS[task.workType],
      Исполнители: task.assignees.map(getUserName).join(', '),
      Статус: STATUS_LABELS[task.status],
      'Плановые часы': task.plannedHours,
      'Фактические часы': task.actualHours,
      'Дата начала': new Date(task.startDate).toLocaleDateString('ru-RU'),
      'Дата окончания': new Date(task.endDate).toLocaleDateString('ru-RU'),
      Описание: task.description || '',
      Приоритет: getPriorityName(task.priority as TaskPriority),
    }));
  };

  const getUserName = (userId: number): string => {
    const user = MOCK_USERS.find((u) => u.id === userId);
    return user?.name || `Пользователь ${userId}`;
  };

  const getProjectName = (projectId: number): string => {
    const project = MOCK_PROJECTS.find((p) => p.id === projectId);
    return project?.name || `Проект ${projectId}`;
  };

  const getPriorityName = (priority: TaskPriority = 'low'): string => {
    return PRIORITY_LABELS[priority];
  };

  // Экспорт в CSV
  const exportToCSV = (tasks: Task[], filename: string = 'tasks') => {
    try {
      const formattedData = formatTasksForExport(tasks);
      const csv = unparse(formattedData, {
        delimiter: ';',
        quotes: true,
        escapeChar: '"',
        columns: [
          'ID',
          'Название задачи',
          'Проект',
          'Тип работы',
          'Исполнители',
          'Статус',
          'Плановые часы',
          'Фактические часы',
          'Дата начала',
          'Дата окончания',
          'Описание',
          'Приоритет',
        ],
      });

      // для корректного отображения кириллицы
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });

      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Export failed:', error);
      return false;
    }
  };

  // Экспорт в Excel
  const exportToExcel = (tasks: Task[], filename: string = 'tasks') => {
    try {
      const formattedData = formatTasksForExport(tasks);
      let html = '<html><head><meta charset="UTF-8"></head><body><table>';

      html += '<tr>';
      Object.keys(formattedData[0] || {}).forEach((key) => {
        html += `<th>${key}</th>`;
      });
      html += '</tr>';

      formattedData.forEach((row) => {
        html += '<tr>';
        Object.values(row).forEach((value) => {
          html += `<td>${value}</td>`;
        });
        html += '</tr>';
      });

      html += '</table></body></html>';

      const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.xls`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Export failed:', error);
      return false;
    }
  };

  return {
    exportToCSV,
    exportToExcel,
  };
}
