import { onMounted, ref, watch } from 'vue';
import { useTasks } from '@/composables/useTasks';
import type { Task, TaskStatus } from '@/types';
import { useRoute } from 'vue-router';

export function useTaskPage() {
  const route = useRoute();

  const {
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    filters,
    tasks,
    pagination,
    getFilters,
    resetFilters,
    updateFilters,
    setPage,
    setPageLimit,
  } = useTasks();

  const viewMode = ref<'table' | 'kanban' | 'chart'>('table');
  const showFormDialog = ref(false);
  const showConfirmDialog = ref(false);
  const selectedTask = ref<Task | null>(null);
  const taskToDelete = ref<Task | null>(null);

  onMounted(async () => {
    const page = Number(route.query.page) || 1;
    const limit = Number(route.query.limit) || 20;

    if (page !== pagination.value.page) {
      setPage(page);
    }

    if (limit !== pagination.value.limit) {
      setPageLimit(limit);
    }

    await getFilters();
    await fetchTasks();
  });

  onMounted(() => {
    const mode = localStorage.getItem('mode') as 'table' | 'kanban' | null;
    if (mode && mode !== viewMode.value) viewMode.value = mode;
  });

  const showCreateDialog = () => {
    selectedTask.value = null;
    showFormDialog.value = true;
  };

  const openEditDialog = (row: Task) => {
    showFormDialog.value = true;
    selectedTask.value = row;
  };
  const confirmDelete = (row: Task) => {
    showConfirmDialog.value = true;
    taskToDelete.value = row;
  };
  const handleStatusChange = async (taskId: number, taskStatus: TaskStatus) => {
    try {
      if (taskToDelete.value) await updateTaskStatus(taskId, { status: taskStatus });
    } catch (error) {
      console.error(error);
    }
  };
  const handleTaskSave = async (task: Omit<Task, 'id'> | Partial<Task>) => {
    try {
      if (selectedTask.value) await updateTask(selectedTask.value.id, task);
      else if (!('id' in task)) await createTask(task as Omit<Task, 'id'>);
      selectedTask.value = null;
      showFormDialog.value = false;
    } catch (error) {
      console.error(error);
    }
  };
  const handleDeleteConfirm = async () => {
    try {
      if (taskToDelete.value) await deleteTask(taskToDelete.value.id);
      taskToDelete.value = null;
      showConfirmDialog.value = false;
    } catch (error) {
      console.error(error);
    }
  };

  watch(viewMode, (newValue) => {
    localStorage.setItem('mode', newValue);
  });

  return {
    viewMode,
    showFormDialog,
    showConfirmDialog,
    selectedTask,
    taskToDelete,
    filters,
    tasks,

    openEditDialog,
    confirmDelete,
    showCreateDialog,
    handleTaskSave,
    handleDeleteConfirm,
    handleStatusChange,
    resetFilters,
    updateFilters,
  };
}
