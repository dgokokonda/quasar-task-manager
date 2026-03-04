<template>
  <div class="kanban row q-col-gutter-md">
    <div v-for="status in STATUSES" :key="status" class="col-12 col-sm-6 col-md-3">
      <q-card class="kanban-column" flat bordered :style="{ borderTopColor: statusColor(status) }">
        <q-card-section class="q-py-sm bg-grey-2">
          <div class="text-subtitle1 text-weight-medium">
            {{ statusLabel(status) }}
          </div>
          <UIBadge :color="statusColor(status)" :label="columnTasks(status).length" />
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
              <UIKanbanCard
                :task="task"
                :get-user-name="getUserName"
                :get-user-initials="getUserInitials"
                :to-detail-page="toDetailPage"
                @edit="emit('edit', $event)"
                @delete="emit('delete', $event)"
              />
            </template>
          </draggable>
        </q-scroll-area>
      </q-card>
    </div>
  </div>
</template>
<script setup lang="ts">
import draggable from 'vuedraggable';
import type { Task } from '@/types';
import { useTaskKanban } from '@/composables/useTaskKanban';
import type { OrderDeltaItem } from '@/services/taskService';
import UIBadge from '../common/UIBadge.vue';
import UIKanbanCard from '../common/UIKanbanCard.vue';

const props = defineProps<{
  tasks: Task[];
}>();

const emit = defineEmits<{
  (e: 'edit', task: Task): void;
  (e: 'delete', task: Task): void;
  (e: 'update', delta: OrderDeltaItem[], tasks: Task[]): void;
  (e: 'update-status', id: number, task: Task): void;
}>();

const {
  STATUSES,
  statusColor,
  statusLabel,
  columnTasks,
  columnHeight,
  setColumn,
  getUserName,
  getUserInitials,
  toDetailPage,
} = useTaskKanban(
  props,
  (delta, tasks) => emit('update', delta, tasks),
  (id, tasks) => emit('update-status', id, tasks),
);
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

.kanban-list :deep(.q-card) {
  cursor: grab;
}
</style>
