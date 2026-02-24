import type { QTableColumn } from 'quasar';
import type { Task } from './index';

export type TaskTableColumn = QTableColumn<Task>;

export interface HoursColumn extends Omit<TaskTableColumn, 'field' | 'sort'> {
  name: 'hours';
  field: (row: Task) => string;
  sort?: (a: string, b: string, rowA: Task, rowB: Task) => number;
}

export interface DatesColumn extends Omit<TaskTableColumn, 'field' | 'sort'> {
  name: 'dates';
  field: (row: Task) => string;
  sort?: (a: string, b: string, rowA: Task, rowB: Task) => number;
}
export interface ActionsColumn extends Omit<TaskTableColumn, 'field'> {
  name: 'actions';
  field: keyof Task | ((row: Task) => unknown);
  align?: 'left' | 'center' | 'right';
}

export type TaskColumn = TaskTableColumn | HoursColumn | DatesColumn | ActionsColumn;
