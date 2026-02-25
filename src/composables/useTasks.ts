import { useTaskStore } from '@/stores/taskStore';
import { storeToRefs } from 'pinia';
import type { TaskStatus } from '@/types';

export function useTasks() {
  const store = useTaskStore();
  const { tasks, loading, filteredTasks, filters } = storeToRefs(store);

  const getTaskByStatus = (status: TaskStatus) =>
    tasks.value.filter((item) => item.status === status);

  return {
    tasks,
    loading,
    filters,
    filteredTasks,
    fetchTasks: store.fetchTasks,
    createTask: store.createTask,
    updateTask: store.updateTask,
    deleteTask: store.deleteTask,
    getTaskByStatus,
    updateTaskStatus: store.updateTask,
    updateTasks: store.updateTasks,
    updateFilters: store.updateFilters,
    resetFilters: store.resetFilters,
  };
}
