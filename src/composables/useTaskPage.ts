import { onMounted, ref } from 'vue';
import { useTasks } from '@/composables/useTasks';
import type { Task, TaskStatus } from '@/types';

export function useTaskPage() {
  const { fetchTasks, createTask, updateTask, deleteTask, updateTaskStatus } = useTasks();

  const viewMode = ref<'table' | 'kanban'>('table');
  const showFormDialog = ref(false);
  const showConfirmDialog = ref(false);
  const selectedTask = ref<Task | null>(null);
  const taskToDelete = ref<Task | null>(null);

  // const localFilters = ref({ ...filters.value });

  onMounted(async () => {
    await fetchTasks();
  });

  const showCreateDialog = () => {
    selectedTask.value = null;
    showFormDialog.value = true;
  };

  // const applyFilters = () => {
  //   updateFilters(localFilters.value);
  // };
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

  return {
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
  };
}
