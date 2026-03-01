import { ref, watch } from 'vue';
import type { Task, TaskStatus } from '@/types';
import { STATUS_COLORS, STATUS_LABELS } from '@/types';
import { MOCK_USERS, KANBAN_COLUMN_HEIGHT } from '@/utils/constants';
import type { OrderDeltaItem } from '@/services/taskService';
import { useRouter } from 'vue-router';

type KanbanUpdateEvent = (delta: OrderDeltaItem[], tasks: Task[]) => void;
type KanbanUpdateStatusEvent = (id: number, task: Task) => void;

export function useTaskKanban(
  props: { tasks: Task[] },
  emitUpdate: KanbanUpdateEvent,
  emitUpdateStatus: KanbanUpdateStatusEvent,
) {
  const router = useRouter();

  const STATUSES: TaskStatus[] = Object.keys(STATUS_LABELS) as TaskStatus[];
  const columnHeight = ref(KANBAN_COLUMN_HEIGHT);

  const statusColor = (status: TaskStatus): string => STATUS_COLORS[status] ?? status;
  const statusLabel = (status: TaskStatus): string => STATUS_LABELS[status] ?? 'grey';

  // Локальные списки по колонкам, чтобы vuedraggable мог мутировать при перетаскивании.
  const columns = ref<Record<TaskStatus, Task[]>>({
    not_started: [],
    in_progress: [],
    on_hold: [],
    completed: [],
  });
  const columnTasks = (status: TaskStatus): Task[] => columns.value[status] ?? [];
  const toDetailPage = (id: number) => router.push({ path: '/tasks/' + id });

  function setTasksByColumnStatus() {
    const list = props.tasks ?? [];
    STATUSES.forEach((status) => {
      columns.value[status] = list.filter((t) => t.status === status);
    });
  }

  setTasksByColumnStatus();
  watch(
    () => props.tasks,
    () => setTasksByColumnStatus(),
    { deep: true },
  );

  function setColumn(status: TaskStatus, newList: Task[]) {
    const oldList = columns.value[status];

    // Определяем тип изменения
    // 1. Проверяем, был ли элемент добавлен (перемещен из другой колонки)
    const addedElement = newList.find((t) => !oldList.some((o) => o.id === t.id));
    // 2. Проверяем, был ли элемент удален (перемещен в другую колонку)
    const removedElement = oldList.find((t) => !newList.some((n) => n.id === t.id));
    // 3. Проверяем, изменился ли порядок внутри колонки
    const orderChanged =
      !addedElement &&
      !removedElement &&
      JSON.stringify(oldList.map((t) => t.id)) !== JSON.stringify(newList.map((t) => t.id));

    columns.value[status] = newList;

    // Создаем полный список задач с новыми порядками
    const allTasks = [...props.tasks];

    // Кейс 1: Перемещение между статусами: Элемент появился в колонке
    if (addedElement) {
      const task = addedElement;
      const newStatus = status;
      const oldGlobalIndex = allTasks.findIndex((t) => t.id === task.id);

      task.status = newStatus;

      if (oldGlobalIndex !== -1) {
        allTasks.splice(oldGlobalIndex, 1);
      }

      const insertIndex = findInsertIndex(allTasks, newList, task.id);
      allTasks.splice(insertIndex, 0, task);

      // Вычисляем дельту для измененных задач
      const delta = calculateDelta(allTasks, props.tasks);
      emitUpdate(delta, allTasks);
      emitUpdateStatus(task.id, task);
    }

    // Кейс 2: Перемещение между статусами: Элемент удален из колонки
    else if (removedElement) {
      columns.value[status] = newList;
    }

    // Кейс 3: Перемещение внутри колонки
    else if (orderChanged) {
      const allTasks = updateGlobalOrder(props.tasks, columns.value);
      const delta = calculateDelta(allTasks, props.tasks);
      emitUpdate(delta, allTasks);
    }
  }

  // Поиск индекса для вставки в глобальный массив
  function findInsertIndex(allTasks: Task[], columnList: Task[], taskId: number): number {
    const indexInColumn = columnList.findIndex((t) => t.id === taskId);

    // Если задача вставляется в начало колонки
    if (indexInColumn === 0) {
      // Ищем первую задачу этой колонки или берем индекс перед следующей колонкой
      let insertIndex = 0;
      for (const s of STATUSES) {
        if (s === columnList[0]?.status) break;
        insertIndex += columns.value[s].length;
      }
      return insertIndex;
    }

    // Вставляем после предыдущей задачи в колонке
    const prevTaskId = columnList[indexInColumn - 1]?.id;
    const prevGlobalIndex = allTasks.findIndex((t) => t.id === prevTaskId);
    return prevGlobalIndex + 1;
  }

  // Обновление глобального порядка на основе колонок
  function updateGlobalOrder(originalTasks: Task[], columns: Record<TaskStatus, Task[]>): Task[] {
    const result: Task[] = [];

    STATUSES.forEach((status) => {
      const columnTasks = columns[status];
      columnTasks.forEach((task) => {
        result.push({ ...task, status });
      });
    });

    return result;
  }

  // Вычисление дельты изменений порядка
  function calculateDelta(newList: Task[], oldList: Task[]): OrderDeltaItem[] {
    const delta: OrderDeltaItem[] = [];

    newList.forEach((task, index) => {
      const oldTask = oldList.find((t) => t.id === task.id);
      if (!oldTask || oldTask.order !== index) {
        delta.push({ id: task.id, order: index });
      }
    });

    return delta;
  }

  function getUserInitials(userId: number): string {
    const user = MOCK_USERS.find((u) => u.id === userId);
    return user
      ? user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
      : '?';
  }

  function getUserName(userId: number): string {
    const user = MOCK_USERS.find((u) => u.id === userId);
    return user?.name || '';
  }

  // Вычисление нового глобального индекса для задачи
  // function calculateNewGlobalIndex(columnList: Task[], taskId: number): number {
  //   const indexInColumn = columnList.findIndex((t) => t.id === taskId);
  //   let globalIndex = 0;

  //   // Суммируем все задачи в предыдущих колонках
  //   for (const s of STATUSES) {
  //     if (s === columnList[0]?.status) break;
  //     globalIndex += columns.value[s].length;
  //   }

  //   // Добавляем позицию внутри колонки
  //   return globalIndex + indexInColumn;
  // }

  return {
    STATUSES,
    statusColor,
    statusLabel,
    columnTasks,
    columnHeight,
    setColumn,
    getUserName,
    getUserInitials,
    toDetailPage,
  };
}
