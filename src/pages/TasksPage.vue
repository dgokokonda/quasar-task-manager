<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h5">Управление задачами</div>
      </div>
      <div class="col-auto">
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
      <TaskTable
        v-if="viewMode === 'table'"
        :tasks="filteredTasks"
        :loading="loading"
        :search="filters.search"
        @edit="openEditDialog"
        @delete="confirmDelete"
        @update="updateTasks"
      />

      <TaskKanban
        v-else
        :tasks="filteredTasks"
        @status-change="handleStatusChange"
        @edit="openEditDialog"
      />
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
import { ref } from 'vue';
import type { TaskFiltersType } from '@/types';
import { useTasks } from '@/composables/useTasks';
import { useTaskPage } from '@/composables/useTaskPage';
import TaskTable from '@/components/tasks/TaskTable.vue';
import TaskKanban from '@/components/tasks/TaskKanban.vue';
import TaskForm from '@/components/tasks/TaskForm.vue';
import TaskFilters from '@/components/tasks/TaskFilters.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';

const {
  loading,
  filters,
  filteredTasks,
  updateFilters,
  resetFilters: storeResetFilters,
  updateTasks,
} = useTasks();

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
} = useTaskPage();

const localFilters = ref<TaskFiltersType>({
  statuses: [],
  search: '',
  workType: [],
  assigneeId: [],
  sortBy: 'name',
  sortOrder: 'asc',
});
const applyFilters = () => {
  updateFilters(localFilters.value);
};
const resetFilters = () => {
  localFilters.value = {
    statuses: [],
    search: '',
    workType: [],
    assigneeId: [],
    sortBy: 'name',
    sortOrder: 'asc',
  };
  storeResetFilters();
};
</script>
