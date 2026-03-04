import { ref, watch, type Ref } from 'vue';
import type { WorkType, TaskStatus } from '@/types';
import { MOCK_USERS, STATUS_LABELS, WORK_TYPE_LABELS } from '@/utils/constants';

export type FilterValue = string | number | boolean | null | (string | number | boolean)[];
export type SearchValue = string;
export type StatusesValue = TaskStatus[];
export type WorkTypeValue = WorkType[];
export type AssigneeValue = number[];
export type SortByValue = string;
export type SortOrderValue = 'asc' | 'desc';
export interface SelectOption extends Record<string, unknown> {
  id: string | number;
  name: string;
}
export type FilterType = 'text' | 'enum' | 'multienum';
export interface FilterConfig<T = FilterValue> {
  id: string;
  type: FilterType;
  label: string;
  prependIcon: string;
  value: Ref<T>;
  options?: SelectOption[];
  optionValue?: string;
  optionLabel?: string;
}
export type SelectValue = string | number | (string | number)[];
export interface TaskFiltersProps {
  search: string;
  statuses: TaskStatus[];
  workType: WorkType[];
  assignee: number[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface TaskFiltersEmits {
  (e: 'update:search', value: string): void;
  (e: 'update:statuses', value: TaskStatus[]): void;
  (e: 'update:workType', value: WorkType[]): void;
  (e: 'update:assignee', value: number[]): void;
  (e: 'update:sortOrder', value: 'asc' | 'desc'): void;
  (e: 'update:sortBy', value: string): void;
  (e: 'apply'): void;
  (e: 'reset'): void;
}

export function useTaskFilters(props: TaskFiltersProps, emit: TaskFiltersEmits) {
  const search = ref<string>(props.search);
  const statuses = ref<TaskStatus[]>(props.statuses);
  const workType = ref<WorkType[]>(props.workType);
  const assignee = ref<number[]>(props.assignee);
  const sortOrder = ref<'asc' | 'desc'>(props.sortOrder);
  const sortBy = ref<string>(props.sortBy);

  const statusOptions: SelectOption[] = Object.entries(STATUS_LABELS).map(([value, label]) => ({
    id: value as TaskStatus,
    name: label,
  }));

  const workTypeOptions: SelectOption[] = Object.entries(WORK_TYPE_LABELS).map(
    ([value, label]) => ({
      id: value as WorkType,
      name: label,
    }),
  );

  const assigneeOptions: SelectOption[] = MOCK_USERS.map((user) => ({
    id: user.id,
    name: user.name,
  }));

  const sortByOptions: SelectOption[] = [
    { id: 'name', name: 'Название задачи' },
    { id: 'startDate', name: 'Дата начала' },
    { id: 'endDate', name: 'Дата окончания' },
    { id: 'plannedHours', name: 'Плановые часы' },
    { id: 'actualHours', name: 'Фактические часы' },
    { id: 'priority', name: 'Приоритет' },
    { id: 'order', name: 'Порядок' },
  ];

  const sortOrderOptions: SelectOption[] = [
    { id: 'asc', name: 'Восходящая' },
    { id: 'desc', name: 'Нисходящая' },
  ];

  const filtersConfig: FilterConfig[] = [
    {
      id: 'search',
      type: 'text',
      label: 'Поиск по названию задачи',
      prependIcon: 'search',
      value: search,
    },
    {
      id: 'statuses',
      type: 'multienum',
      label: 'Статус задачи',
      prependIcon: 'flag',
      value: statuses,
      options: statusOptions,
    },
    {
      id: 'workType',
      type: 'multienum',
      label: 'Тип работы',
      prependIcon: 'work',
      value: workType,
      options: workTypeOptions,
    },
    {
      id: 'assignee',
      type: 'multienum',
      label: 'Исполнитель',
      prependIcon: 'person',
      value: assignee,
      options: assigneeOptions,
      optionValue: 'id',
      optionLabel: 'name',
    },
    {
      id: 'sortBy',
      type: 'enum',
      label: 'Сортировка по полю',
      prependIcon: 'reorder',
      value: sortBy,
      options: sortByOptions,
    },
    {
      id: 'sortOrder',
      type: 'enum',
      label: 'Порядок сортировки',
      prependIcon: 'swap_vert',
      value: sortOrder,
      options: sortOrderOptions,
    },
  ];

  const handleFilterUpdate = (id: string, value: unknown) => {
    switch (id) {
      case 'search':
        emit('update:search', value as string);
        break;
      case 'statuses':
        emit('update:statuses', value as TaskStatus[]);
        break;
      case 'workType':
        emit('update:workType', value as WorkType[]);
        break;
      case 'assignee':
        emit('update:assignee', value as number[]);
        break;
      case 'sortBy':
        emit('update:sortBy', value as string);
        break;
      case 'sortOrder':
        emit('update:sortOrder', value as 'asc' | 'desc');
        break;
    }
  };

  watch(
    () => [
      props.search,
      props.statuses,
      props.workType,
      props.assignee,
      props.sortBy,
      props.sortOrder,
    ],
    () => {
      search.value = props.search;
      statuses.value = [...props.statuses];
      workType.value = [...props.workType];
      assignee.value = [...props.assignee];
      sortBy.value = props.sortBy;
      sortOrder.value = props.sortOrder;
    },
    { immediate: true, deep: true },
  );

  const onReset = () => {
    search.value = '';
    statuses.value = [];
    workType.value = [];
    assignee.value = [];
    sortBy.value = 'name';
    sortOrder.value = 'asc';

    emit('update:search', '');
    emit('update:statuses', []);
    emit('update:workType', []);
    emit('update:assignee', []);
    emit('update:sortBy', 'name');
    emit('update:sortOrder', 'asc');
    emit('reset');
  };

  return {
    search,
    statuses,
    workType,
    assignee,
    sortOrder,
    sortBy,
    statusOptions,
    workTypeOptions,
    assigneeOptions,
    sortByOptions,
    sortOrderOptions,
    filtersConfig,
    handleFilterUpdate,
    onReset,
  };
}
