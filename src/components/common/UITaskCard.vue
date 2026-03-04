<template>
  <q-card flat bordered class="q-pa-md">
    <q-card-section class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <div class="text-caption text-grey-7">Статус</div>
        <UIBadge :color="statusColors[task.status] ?? ''">{{ statusLabels[task.status] }}</UIBadge>
      </div>
      <div class="col-12 col-md-6">
        <div class="text-caption text-grey-7">Тип работы</div>
        <span>{{ workTypeLabels[task.workType] }}</span>
      </div>
      <div class="col-12 col-md-6">
        <div class="text-caption text-grey-7">Часы (факт / план)</div>
        <span>{{ task.actualHours }} / {{ task.plannedHours }}</span>
      </div>
      <div class="col-12 col-md-6">
        <div class="text-caption text-grey-7">Сроки</div>
        <span>{{ formatDate(task.startDate) }} — {{ formatDate(task.endDate) }}</span>
      </div>
      <div class="col-12">
        <div class="text-caption text-grey-7">Исполнители</div>
        <UIAvatar
          v-for="uid in task.assignees"
          :key="uid"
          size="32px"
          class="q-mr-xs"
          color="primary"
          text-color="white"
          :title="getUserName(uid)"
        >
          {{ getUserInitials(uid) }}
        </UIAvatar>
      </div>
      <div v-if="task.description" class="col-12">
        <div class="text-caption text-grey-7">Описание</div>
        <p class="q-mt-xs q-mb-none">{{ task.description }}</p>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { Task } from '@/types';
import UIBadge from '@/components/common/UIBadge.vue';
import UIAvatar from '@/components/common/UIAvatar.vue';

defineProps<{
  task: Task;
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
  workTypeLabels: Record<string, string>;
  formatDate: (date: string) => string;
  getUserName: (id: number) => string;
  getUserInitials: (id: number) => string;
}>();
</script>
