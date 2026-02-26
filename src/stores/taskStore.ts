import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
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

    // Порядок выводим из индекса в tasks.value (O(1) на задачу), без поля order на каждом объекте
    const orderByIndex =
      fieldName === 'order' && tasks.value.length > 0
        ? new Map(tasks.value.map((t, i) => [t.id, i]))
        : null;

    return [...result].sort((a, b) => {
      if (orderByIndex) {
        const aIdx = orderByIndex.get(a.id) ?? 0;
        const bIdx = orderByIndex.get(b.id) ?? 0;
        return (aIdx - bIdx) * sortOrder;
      }

      const aVal = a[fieldName];
      const bVal = b[fieldName];

      if (aVal == null) return 1 * sortOrder;
      if (bVal == null) return -1 * sortOrder;
      if (aVal === bVal) return 0;

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
      const response = await taskService.getTasks({
        sortBy: 'order',
        sortOrder: 'asc',
      });
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

  // Обновление порядка (после drag-drop). Отправляется только дельта изменённых order.
  async function updateTasks(updatedTasks: Task[]) {
    const current = tasks.value;
    if (current.length === 0) return;

    const oldOrder = new Map<number, number>(current.map((t, i) => [t.id, t.order ?? i]));
    const visibleIds = new Set(updatedTasks.map((t) => t.id));

    // Новый глобальный порядок: видимые таски по позициям в updatedTasks (от 0 до n), остальные в старом относительном порядке
    const newOrder = new Map<number, number>();
    updatedTasks.forEach((t, i) => newOrder.set(t.id, i));
    let nextOrder = updatedTasks.length;
    const rest = current
      .filter((t) => !visibleIds.has(t.id))
      .sort((a, b) => (oldOrder.get(a.id) ?? 0) - (oldOrder.get(b.id) ?? 0));
    rest.forEach((t) => {
      newOrder.set(t.id, nextOrder++);
    });

    const delta: OrderDeltaItem[] = [];
    newOrder.forEach((order, id) => {
      if (oldOrder.get(id) !== order) delta.push({ id, order });
    });
    if (delta.length === 0) return;

    loading.value = true;
    error.value = null;
    try {
      await taskService.updateTasksOrderDelta(delta);
      // Локально применяем новый порядок
      const byId = new Map(current.map((t) => [t.id, t]));
      const ordered = [...newOrder.entries()]
        .sort((a, b) => a[1] - b[1])
        .map(([id]) => byId.get(id)!)
        .filter(Boolean);
      ordered.forEach((t, i) => {
        (t as Task).order = i;
      });
      tasks.value = ordered;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update order';
      console.error('Update order error:', err);
      error.value = message;
    } finally {
      loading.value = false;
    }
  }

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
