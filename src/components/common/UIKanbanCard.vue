<template>
  <q-card class="kanban-task q-mb-sm cursor-move" flat bordered @click="emit('edit', task)">
    <q-card-section class="q-py-sm">
      <div
        class="text-body2 text-weight-medium ellipsis-2 cursor-pointer"
        @click.stop="toDetailPage(task.id)"
      >
        {{ task.name }}
      </div>
      <div class="row items-center q-mt-xs">
        <UIAvatar
          v-for="uid in task.assignees.slice(0, 3)"
          :key="uid"
          size="24px"
          class="q-mr-xs"
          color="primary"
          text-color="white"
          :title="getUserName(uid)"
        >
          {{ getUserInitials(uid) }}
        </UIAvatar>
        <span class="text-caption text-grey">
          {{ task.actualHours }} / {{ task.plannedHours }} ч
        </span>
      </div>
    </q-card-section>
    <q-card-actions align="right" class="q-pt-none">
      <UIButton
        flat
        round
        dense
        icon="edit"
        size="sm"
        title="Редактировать"
        @click.stop="emit('edit', task)"
      />
      <UIButton
        flat
        round
        dense
        icon="delete"
        size="sm"
        title="Удалить"
        @click.stop="emit('delete', task)"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import type { Task } from '@/types';
import UIAvatar from './UIAvatar.vue';
import UIButton from './UIButton.vue';

defineProps<{
  task: Task;
  getUserName: (id: number) => string;
  getUserInitials: (id: number) => string;
  toDetailPage: (id: number) => void;
}>();

const emit = defineEmits<{
  (e: 'edit', task: Task): void;
  (e: 'delete', task: Task): void;
}>();
</script>
