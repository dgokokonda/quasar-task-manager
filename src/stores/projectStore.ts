import { defineStore } from 'pinia';
import { projectService } from '@/services/projectService';
import { ref } from 'vue';
import type { Project } from '@/types';
import { useQuasar } from 'quasar';

export const useProjectStore = defineStore('projectStore', () => {
  const $q = useQuasar();
  const projects = ref<Project[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchProjects() {
    loading.value = true;
    error.value = null;
    try {
      const response = await projectService.getProjects();
      if (response) projects.value = response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch projects';
      console.error('Fetch projects error:', err);
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

  return {
    projects,
    loading,
    fetchProjects,
  };
});
