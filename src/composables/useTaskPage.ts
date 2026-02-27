import { onMounted, ref, watch } from 'vue';
import { useTasks } from '@/composables/useTasks';
import type { Task, TaskStatus } from '@/types';

export function useTaskPage() {
  const {
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    filters,
    tasks,
    getFilters,
    resetFilters,
    updateFilters,
  } = useTasks();

  const viewMode = ref<'table' | 'kanban'>('table');
  const showFormDialog = ref(false);
  const showConfirmDialog = ref(false);
  const selectedTask = ref<Task | null>(null);
  const taskToDelete = ref<Task | null>(null);

  onMounted(async () => {
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
