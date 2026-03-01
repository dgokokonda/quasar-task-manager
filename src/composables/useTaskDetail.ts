import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { taskService } from '@/services/taskService';
import { useTaskStore } from '@/stores/taskStore';
import type { Task } from '@/types';
import { MOCK_USERS } from '@/utils/constants';

export function useTaskDetail() {
  const route = useRoute();
  const router = useRouter();
  const store = useTaskStore();

  const task = ref<Task | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);
  const showFormDialog = ref(false);
  const showConfirmDialog = ref(false);

  function loadTask() {
    const id = Number(route.params.id);
    if (!id || Number.isNaN(id)) {
      error.value = 'Некорректный id задачи';
      loading.value = false;
      return;
    }
    loading.value = true;
    error.value = null;
    taskService
      .getTask(id)
      .then((t) => {
        task.value = t;
      })
      .catch((e) => {
        error.value = e instanceof Error ? e.message : 'Не удалось загрузить задачу';
      })
      .finally(() => {
        loading.value = false;
      });
  }

  onMounted(loadTask);
  watch(() => route.params.id, loadTask);

  function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ru-RU');
  }

  function getUserInitials(userId: number): string {
    const user = MOCK_USERS.find((u) => u.id === userId);
    return user
      ? user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
      : '?';
  }

  function confirmDelete() {
    showConfirmDialog.value = true;
  }

  async function handleTaskSave(updates: Partial<Task> | Omit<Task, 'id'>) {
    if (!task.value) return;
    const updated = await store.updateTask(task.value.id, updates as Partial<Task>);
    if (updated) task.value = updated;
    showFormDialog.value = false;
  }

  async function handleDeleteConfirm() {
    if (!task.value) return;
    await store.deleteTask(task.value.id);
    showConfirmDialog.value = false;
    await router.push({ name: 'tasks' });
  }

  return {
    loading,
    error,
    task,
    showFormDialog,
    confirmDelete,
    formatDate,
    getUserInitials,
    showConfirmDialog,
    handleDeleteConfirm,
    handleTaskSave,
  };
}
