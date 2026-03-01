<template>
  <div class="q-table-container">
    <div class="q-table__top">
      <div class="text-h6">Менеджер задач</div>
    </div>
    <table class="q-table">
      <thead>
        <tr>
          <th class="q-table__th text-left" style="width: 40px" />
          <th
            v-for="col in columns"
            :key="col.name"
            class="q-table__th"
            :class="`text-${col.align || 'left'}`"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <draggable-component
        v-if="draggableTasks.length"
        v-model="draggableTasks"
        @end="onDragEnd"
        item-key="id"
        group="tasks"
        tag="tbody"
        handle=".drag-handle"
        class="q-table__tbody"
      >
        <template #item="{ element: row }">
          <tr :key="row.id" class="q-table__tr cursor-pointer">
            <td class="q-table__td">
              <q-icon name="drag_handle" class="drag-handle q-mr-sm" />
            </td>
            <td class="q-table__td" @click="toDetailPage(row.id)">{{ row.name }}</td>
            <td class="q-table__td">{{ getProjectName(row.projectId) }}</td>
            <td class="q-table__td">{{ WORK_TYPE_LABELS[row.workType as WorkType] }}</td>
            <td class="q-table__td">
              <q-avatar
                v-for="assigneeId in row.assignees"
                :key="assigneeId"
                size="24px"
                class="q-mr-xs"
                color="primary"
                text-color="white"
                :title="getUserName(assigneeId)"
              >
                {{ getUserInitials(assigneeId) }}
              </q-avatar>
            </td>
            <td class="q-table__td text-center">
              {{ `${row.actualHours} / ${row.plannedHours}` }}
            </td>
            <td class="q-table__td text-center">
              <q-badge :color="STATUS_COLORS[row.status as TaskStatus]">
                {{ STATUS_LABELS[row.status as TaskStatus] }}
              </q-badge>
            </td>
            <td class="q-table__td text-center">
              {{ `${formatDate(row.startDate)} - ${formatDate(row.endDate)}` }}
            </td>
            <td class="q-table__td text-center">
              <q-btn flat round dense icon="edit" size="sm" @click="emit('edit', row)">
                Редактировать
              </q-btn>
              <q-btn flat round dense icon="delete" size="sm" @click="emit('delete', row)">
                Удалить
              </q-btn>
            </td>
          </tr>
        </template>
      </draggable-component>
      <tfoot v-else-if="!draggableTasks.length && !loading" class="empty">
        <tr>
          Список задач пуст
        </tr>
      </tfoot>
    </table>
  </div>
</template>
<script setup lang="ts">
import { useTaskTable } from '@/composables/useTaskTable';
import type { OrderDeltaItem } from '@/services/taskService';
import draggableComponent from 'vuedraggable';
import { ref, watch } from 'vue';
import type { Task, TaskStatus, WorkType } from '@/types';
import { STATUS_COLORS, STATUS_LABELS, WORK_TYPE_LABELS } from '@/types';
import { useRouter } from 'vue-router';

interface Props {
  tasks: Task[];
  loading: boolean;
  search: string;
}

interface DragEndEvt {
  newIndex: number;
  oldIndex: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'edit', task: Task): void;
  (e: 'delete', task: Task): void;
  (e: 'update', delta: OrderDeltaItem[], tasks: Task[]): void;
}>();
const router = useRouter();

const { columns, getUserInitials, getUserName, getProjectName, formatDate } = useTaskTable();

const draggableTasks = ref<Task[]>([...props.tasks]);

watch(
  () => props.tasks,
  (newTasks) => {
    draggableTasks.value = [...newTasks];
  },
  { deep: true },
);

const onDragEnd = (evt: DragEndEvt) => {
  const delta =
    evt.newIndex < evt.oldIndex
      ? draggableTasks.value.slice(evt.newIndex, evt.oldIndex + 1)
      : draggableTasks.value.slice(evt.oldIndex, evt.newIndex + 1);
  const startIndex = evt.newIndex < evt.oldIndex ? evt.newIndex : evt.oldIndex;
  const deltaOrder = delta.map((el, i) => ({
    id: el.id,
    order: startIndex + i,
  }));
  emit('update', deltaOrder, draggableTasks.value);
};

const toDetailPage = (id: number) => router.push({ path: '/tasks/' + id });
</script>
<style scoped lang="scss">
tfoot.empty div {
  width: 100%;
  display: block;
  position: absolute;
  text-align: center;
}
</style>
