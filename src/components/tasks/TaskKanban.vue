<template>
  <div class="kanban row q-col-gutter-md">
    <div v-for="status in STATUSES" :key="status" class="col-12 col-sm-6 col-md-3">
      <q-card class="kanban-column" flat bordered :style="{ borderTopColor: statusColor(status) }">
        <q-card-section class="q-py-sm bg-grey-2">
          <div class="text-subtitle1 text-weight-medium">
            {{ statusLabel(status) }}
          </div>
          <q-badge :color="statusColor(status)" :label="columnTasks(status).length" />
        </q-card-section>
        <q-separator />
        <q-scroll-area class="kanban-column-scroll" :style="{ height: columnHeight }" visible>
          <draggable
            :model-value="columnTasks(status)"
            :group="{ name: 'kanban', pull: true, put: true }"
            item-key="id"
            class="kanban-list q-pa-sm"
            ghost-class="kanban-ghost"
            drag-class="kanban-drag"
            @update:model-value="(v: Task[] | undefined) => setColumn(status, v ?? [])"
          >
            <template #item="{ element: task }">
              <q-card
                class="kanban-task q-mb-sm cursor-move"
                flat
                bordered
                @click="emit('edit', task)"
              >
                <q-card-section class="q-py-sm">
                  <div class="text-body2 text-weight-medium ellipsis-2">
                    {{ task.name }}
                  </div>
                  <div class="row items-center q-mt-xs">
                    <q-avatar
                      v-for="uid in task.assignees.slice(0, 3)"
                      :key="uid"
                      size="24px"
                      class="q-mr-xs"
                      color="primary"
                      text-color="white"
                      :title="getUserName(uid)"
                    >
                      {{ getUserInitials(uid) }}
                    </q-avatar>
                    <span class="text-caption text-grey">
                      {{ task.actualHours }} / {{ task.plannedHours }} ч
                    </span>
                  </div>
                </q-card-section>
                <q-card-actions align="right" class="q-pt-none">
                  <q-btn flat round dense icon="edit" size="sm" @click.stop="emit('edit', task)" />
                  <q-btn
                    flat
                    round
                    dense
                    icon="delete"
                    size="sm"
                    @click.stop="emit('delete', task)"
                  />
                </q-card-actions>
              </q-card>
            </template>
          </draggable>
        </q-scroll-area>
      </q-card>
    </div>
  </div>
</template>
<script setup lang="ts">
import draggable from 'vuedraggable';
import { ref, watch } from 'vue';
import type { Task, TaskStatus } from '@/types';
import { STATUS_COLORS, STATUS_LABELS } from '@/types';
import { MOCK_USERS, KANBAN_COLUMN_HEIGHT } from '@/utils/constants';
import type { OrderDeltaItem } from '@/services/taskService';

const STATUSES: TaskStatus[] = Object.keys(STATUS_LABELS) as TaskStatus[];
const columnHeight = ref(KANBAN_COLUMN_HEIGHT);

const props = defineProps<{
  tasks: Task[];
}>();

const emit = defineEmits<{
  (e: 'edit', task: Task): void;
  (e: 'delete', task: Task): void;
  (e: 'update', delta: OrderDeltaItem[], tasks: Task[]): void;
  (e: 'update-status', id: number, task: Task): void;
}>();

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
    console.log(delta, allTasks);
    emit('update', delta, allTasks);
    emit('update-status', task.id, task);
  }

  // Кейс 2: Перемещение между статусами: Элемент удален из колонки
  else if (removedElement) {
    columns.value[status] = newList;
  }

  // Кейс 3: Перемещение внутри колонки
  else if (orderChanged) {
    const allTasks = updateGlobalOrder(props.tasks, columns.value);
    const delta = calculateDelta(allTasks, props.tasks);
    emit('update', delta, allTasks);
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
</script>
<style scoped>
.kanban-column {
  border-top: 4px solid;
  min-height: 200px;
}

.kanban-column-scroll {
  min-height: 120px;
}

.kanban-list {
  min-height: 80px;
}

.kanban-ghost {
  opacity: 0.4;
  background: var(--q-primary);
}

.kanban-drag {
  opacity: 0.9;
  cursor: grabbing;
}

.ellipsis-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.kanban-list .q-card {
  cursor: grab;
}

.kanban-list .q-card .text-body2 {
  cursor: text;
}
</style>
