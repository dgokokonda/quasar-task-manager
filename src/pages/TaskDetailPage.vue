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
          <UIButton
            flat
            color="primary"
            label="Редактировать"
            icon="edit"
            @click="showFormDialog = true"
          />
          <UIButton flat color="negative" label="Удалить" icon="delete" @click="confirmDelete" />
        </div>
      </div>

      <UITaskCard
        :task="task"
        :status-colors="STATUS_COLORS"
        :status-labels="STATUS_LABELS"
        :work-type-labels="WORK_TYPE_LABELS"
        :format-date="formatDate"
        :get-user-name="getUserName"
        :get-user-initials="getUserInitials"
      />
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
import UIButton from '@/components/common/UIButton.vue';
import UITaskCard from '@/components/common/UITaskCard.vue';

const {
  loading,
  error,
  task,
  showFormDialog,
  confirmDelete,
  formatDate,
  getUserInitials,
  getUserName,
  showConfirmDialog,
  handleDeleteConfirm,
  handleTaskSave,
} = useTaskDetail();
</script>
