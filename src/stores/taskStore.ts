import { defineStore } from 'pinia';
import { ref } from 'vue';
import { taskService, type OrderDeltaItem } from '@/services/taskService';
import type { Task, TaskFiltersType } from '@/types';
import { useQuasar } from 'quasar';

export const useTaskStore = defineStore('tasks', () => {
  const $q = useQuasar();

  const tasks = ref<Task[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filters = ref<TaskFiltersType>({
    statuses: [],
    search: '',
    workType: [],
    assigneeId: [],
    sortBy: 'order',
    sortOrder: 'asc',
  });

  async function fetchTasks() {
    loading.value = true;
    error.value = null;
    try {
      const response = await taskService.getTasks();
      if (response) {
        tasks.value = response.map((t, i) => ({ ...t, order: t.order ?? i }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tasks';
      console.error('Fetch tasks error:', err);
      error.value = message;
      $q.notify({
        type: 'negative',
        message,
        position: 'top',
      });
    } finally {
      loading.value = false;
    }
  }

  async function createTask(task: Omit<Task, 'id'>) {
    loading.value = true;
    error.value = null;
    try {
      const response = await taskService.createTask(task);
      if (response) tasks.value = [...tasks.value, response];
      $q.notify({
        type: 'positive',
        message: 'Задача создана',
        position: 'top',
      });
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create task';
      console.error('Fetch tasks error:', err);
      error.value = message;
      $q.notify({
        type: 'negative',
        message,
        position: 'top',
      });
    } finally {
      loading.value = false;
    }
  }

  async function updateTask(id: number, updates: Partial<Task>) {
    loading.value = true;
    error.value = null;
    try {
      const response = await taskService.updateTask(id, updates);
      if (response) {
        const index = tasks.value.findIndex((t) => t.id === id);
        tasks.value[index] = { ...response, order: index };
        $q.notify({
          type: 'positive',
          message: 'Задача обновлена',
          position: 'top',
        });
        return response;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update task';
      console.error('Fetch tasks error:', err);
      error.value = message;
      $q.notify({
        type: 'negative',
        message,
        position: 'top',
      });
    } finally {
      loading.value = false;
    }
  }

  async function deleteTask(id: number) {
    loading.value = true;
    error.value = null;
    try {
      await taskService.deleteTask(id);
      tasks.value = tasks.value.filter((t) => t.id !== id);
      $q.notify({
        type: 'positive',
        message: 'Задача удалена',
        position: 'top',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete task';
      console.error('Fetch tasks error:', err);
      error.value = message;
      $q.notify({
        type: 'negative',
        message,
        position: 'top',
      });
    } finally {
      loading.value = false;
    }
  }

  async function updateTasks(delta: OrderDeltaItem[] = [], ordered: Task[]) {
    if (delta.length === 0) return;

    loading.value = true;
    error.value = null;
    try {
      await taskService.updateTasksOrderDelta(delta); // Отправляется только дельта изменённых order.
      tasks.value = ordered;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update order';
      console.error('Update order error:', err);
      error.value = message;
    } finally {
      loading.value = false;
    }
  }

  async function getFilters() {
    try {
      const response = await taskService.getFilters();
      if (response) filters.value = response;
    } catch (error) {
      console.error('Fetch filters error:', error);
    }
  }

  async function updateFilters(newFilters: Partial<TaskFiltersType>) {
    try {
      const response = await taskService.applyFilters(newFilters);
      filters.value = response;
      await fetchTasks();
    } catch (error) {
      console.error('Failed to apply filters', error);
    }
  }

  async function resetFilters() {
    try {
      const newFilters: TaskFiltersType = {
        statuses: [],
        search: '',
        workType: [],
        assigneeId: [],
        sortBy: 'order',
        sortOrder: 'asc',
      };
      const response = await taskService.applyFilters(newFilters);
      filters.value = response;
      await fetchTasks();
    } catch (error) {
      console.error('Failed to reset filters', error);
    }
  }

  return {
    tasks,
    loading,
    error,
    filters,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    updateFilters,
    resetFilters,
    updateTasks,
    getFilters,
  };
});
