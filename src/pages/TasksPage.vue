<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h5">Управление задачами</div>
      </div>
      <div class="col-auto">
        <q-btn
          flat
          color="primary"
          icon="download"
          label="CSV"
          title="Экспорт списка задач в CSV"
          @click="exportCSV"
          :disable="!tasks.length"
        />
        <q-btn
          flat
          color="primary"
          icon="download"
          label="Excel"
          title="Экспорт списка задач в Excel"
          @click="exportExcel"
          :disable="!tasks.length"
        />
        <q-btn label="Новая задача" icon="add" color="primary" @click="showCreateDialog" />
      </div>
    </div>

    <TaskFilters
      v-model:search="localFilters.search"
      v-model:statuses="localFilters.statuses"
      v-model:workType="localFilters.workType"
      v-model:assignee="localFilters.assigneeId"
      v-model:sortOrder="localFilters.sortOrder"
      v-model:sortBy="localFilters.sortBy"
      @apply="applyFilters"
      @reset="resetFilters"
    />

    <div class="row justify-end q-mb-md">
      <q-btn-toggle
        v-model="viewMode"
        :options="[
          { label: 'Таблица', value: 'table' },
          { label: 'Канбан', value: 'kanban' },
          { label: 'График', value: 'chart' },
        ]"
        toggle-color="primary"
        unelevated
        no-caps
      />
    </div>

    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="3em" />
    </div>

    <template v-else>
      <TaskPagination v-if="tasks.length > 0" key="0" />
      <TaskTable
        v-if="viewMode === 'table'"
        :tasks="tasks"
        :loading="loading"
        :search="filters.search"
        @edit="openEditDialog"
        @delete="confirmDelete"
        @update="updateTasks"
      />

      <TaskKanban
        v-else-if="viewMode === 'kanban'"
        :tasks="tasks"
        @status-change="handleStatusChange"
        @edit="openEditDialog"
        @delete="confirmDelete"
        @update="updateTasks"
        @update-status="updateTask"
      />
      <TaskChart :tasks="tasks" :loading="loading" v-else />
      <TaskPagination v-if="tasks.length > 0" key="1" />
    </template>
  </q-page>

  <TaskForm v-model="showFormDialog" :task="selectedTask" @save="handleTaskSave" />
  <ConfirmDialog
    v-if="taskToDelete && showConfirmDialog"
    v-model="showConfirmDialog"
    title="Удаление задачи"
    :taskName="taskToDelete?.name"
    @confirm="handleDeleteConfirm"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { TaskFiltersType } from '@/types';
import { useTasks } from '@/composables/useTasks';
import { useTaskPage } from '@/composables/useTaskPage';
import TaskPagination from '@/components/tasks/TaskPagination.vue';
import TaskTable from '@/components/tasks/TaskTable.vue';
import TaskKanban from '@/components/tasks/TaskKanban.vue';
import TaskChart from '@/components/tasks/TaskChart.vue';
import TaskForm from '@/components/tasks/TaskForm.vue';
import TaskFilters from '@/components/tasks/TaskFilters.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';

const { loading, filters, tasks, updateFilters, resetFilters, updateTasks, updateTask } =
  useTasks();

const {
  viewMode,
  showFormDialog,
  showConfirmDialog,
  selectedTask,
  taskToDelete,
  openEditDialog,
  confirmDelete,
  showCreateDialog,
  handleTaskSave,
  handleDeleteConfirm,
  handleStatusChange,
  exportCSV,
  exportExcel,
} = useTaskPage();

const localFilters = ref<TaskFiltersType>(filters.value);
const applyFilters = async () => {
  await updateFilters(localFilters.value);
};
watch(
  () => filters.value,
  (newVal) => {
    if (newVal) localFilters.value = { ...filters.value };
  },
  { immediate: true, deep: true },
);
</script>
