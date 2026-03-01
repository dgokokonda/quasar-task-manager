<template>
  <q-page class="q-pa-md">
    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="3em" />
    </div>
    <div v-else-if="error" class="q-pa-md">
      <q-banner class="bg-negative text-white rounded-borders">
        {{ error }}
        <template #action>
          <q-btn flat label="К списку" :to="{ name: 'tasks' }" />
        </template>
      </q-banner>
    </div>
    <template v-else-if="task">
      <div class="row items-center q-mb-md">
        <div class="col">
          <q-btn flat round dense icon="arrow_back" :to="{ name: 'tasks' }" />
          <span class="text-h5 q-ml-sm">{{ task.name }}</span>
        </div>
        <div class="col-auto">
          <q-btn
            flat
            color="primary"
            label="Редактировать"
            icon="edit"
            @click="showFormDialog = true"
          />
          <q-btn flat color="negative" label="Удалить" icon="delete" @click="confirmDelete" />
        </div>
      </div>

      <q-card flat bordered class="q-pa-md">
        <q-card-section class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <div class="text-caption text-grey-7">Статус</div>
            <q-badge :color="STATUS_COLORS[task.status]">{{ STATUS_LABELS[task.status] }}</q-badge>
          </div>
          <div class="col-12 col-md-6">
            <div class="text-caption text-grey-7">Тип работы</div>
            <span>{{ WORK_TYPE_LABELS[task.workType] }}</span>
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
            <q-avatar
              v-for="uid in task.assignees"
              :key="uid"
              size="32px"
              class="q-mr-xs"
              color="primary"
              text-color="white"
            >
              {{ getUserInitials(uid) }}
            </q-avatar>
          </div>
          <div v-if="task.description" class="col-12">
            <div class="text-caption text-grey-7">Описание</div>
            <p class="q-mt-xs q-mb-none">{{ task.description }}</p>
          </div>
        </q-card-section>
      </q-card>
    </template>

    <TaskForm v-model="showFormDialog" :task="task ?? null" @save="handleTaskSave" />
    <ConfirmDialog
      v-model="showConfirmDialog"
      title="Удаление задачи"
      message="Вы уверены, что хотите удалить эту задачу?"
      @confirm="handleDeleteConfirm"
    />
  </q-page>
</template>

<script setup lang="ts">
import { STATUS_COLORS, STATUS_LABELS } from '@/types';
import { WORK_TYPE_LABELS } from '@/utils/constants';
import TaskForm from '@/components/tasks/TaskForm.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import { useTaskDetail } from '@/composables/useTaskDetail';

const {
  loading,
  error,
  task,
  showFormDialog,
  confirmDelete,
  formatDate,
  getUserInitials,
  showConfirmDialog,
  handleDeleteConfirm,
  handleTaskSave,
} = useTaskDetail();
</script>
