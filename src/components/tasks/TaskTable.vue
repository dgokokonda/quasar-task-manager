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
        v-model="draggableTasks"
        item-key="id"
        tag="tbody"
        handle=".drag-handle"
        class="q-table__tbody"
      >
        <template #item="{ element: row }">
          <tr :key="row.id" class="q-table__tr cursor-pointer">
            <td class="q-table__td">
              <q-icon name="drag_handle" class="drag-handle q-mr-sm" />
            </td>
            <td class="q-table__td">{{ row.name }}</td>
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
    </table>
  </div>
</template>
<script setup lang="ts">
import { useTaskTable } from '@/composables/useTaskTable';
import draggableComponent from 'vuedraggable';
import { computed } from 'vue';
import type { Task, TaskStatus, WorkType } from '@/types';
import { STATUS_COLORS, STATUS_LABELS, WORK_TYPE_LABELS } from '@/types';
interface Props {
  tasks: Task[];
  loading: boolean;
  search: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'edit', task: Task): void;
  (e: 'delete', task: Task): void;
  (e: 'update', tasks: Task[]): void;
}>();

const { columns, getUserInitials, getUserName, getProjectName, formatDate } = useTaskTable();

const draggableTasks = computed({
  get: () => props.tasks,
  set: (list: Task[]) => emit('update', list),
});
</script>
