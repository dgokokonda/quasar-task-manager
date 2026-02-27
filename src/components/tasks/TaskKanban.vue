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
import type { Task } from '@/types';
import { useTaskKanban } from '@/composables/useTaskKanban';
import type { OrderDeltaItem } from '@/services/taskService';

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

.kanban-list .q-card {
  cursor: grab;
}

.kanban-list .q-card .text-body2 {
  cursor: text;
}
</style>
