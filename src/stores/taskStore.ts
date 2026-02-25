import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { taskService } from '@/services/taskService';
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
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const filteredTasks = computed(() => {
    let result = [...tasks.value];

    if (filters.value.statuses.length) {
      result = result.filter((task) => filters.value.statuses.includes(task.status));
    }

    if (filters.value.search) {
      const searchLower = filters.value.search.toLowerCase();
      result = result.filter((task) => task.name.toLowerCase().includes(searchLower));
    }

    if (filters.value.workType.length) {
      result = result.filter((task) => filters.value.workType.includes(task.workType));
    }

    if (filters.value.assigneeId?.length) {
      const assignee = new Set(filters.value.assigneeId);
      result = result.filter((task) => task.assignees.some((t) => assignee.has(t)));
    }

    const fieldName = filters.value.sortBy;
    const sortOrder = filters.value.sortOrder === 'asc' ? 1 : -1;

    if (result.length <= 1) return result;

    return [...result].sort((a, b) => {
      const aVal = a[fieldName];
      const bVal = b[fieldName];

      if (aVal == null) return 1 * sortOrder;
      if (bVal == null) return -1 * sortOrder;
      if (aVal === bVal) return 0;

      if (fieldName === 'order') {
        return (Number(aVal) - Number(bVal)) * sortOrder;
      }
      if (fieldName === 'startDate' || fieldName === 'endDate') {
        const aTime = new Date(aVal).getTime();
        const bTime = new Date(bVal).getTime();
        return (aTime - bTime) * sortOrder;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal, 'ru') * sortOrder;
      }

      return (Number(aVal) - Number(bVal)) * sortOrder;
    });
  });

  async function fetchTasks() {
    loading.value = true;
    error.value = null;
    try {
      const response = await taskService.getTasks();
      if (response) {
        tasks.value = response.map((t, i) => ({ ...t, order: i }));
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

  const updateTasks = async (updatedTasks: Task[]) => {
    const response = await taskService.updateTasksOrder(updatedTasks);
    if (response) {
      tasks.value = response.map((t, i) => ({ ...t, order: i }));
    } else throw new Error('Update tasks error');
  };

  function updateFilters(newFilters: Partial<TaskFiltersType>) {
    filters.value = { ...filters.value, ...newFilters };
  }

  function resetFilters() {
    filters.value = {
      statuses: [],
      search: '',
      workType: [],
      assigneeId: [],
      sortBy: 'order',
      sortOrder: 'asc',
    };
  }

  return {
    tasks,
    loading,
    error,
    filters,
    filteredTasks,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    updateFilters,
    resetFilters,
    updateTasks,
  };
});
