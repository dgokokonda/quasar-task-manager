import { defineStore } from 'pinia';
import { projectService } from '@/services/projectService';
import { ref } from 'vue';
import type { Project } from '@/types';

export const projectStore = defineStore('projectStore', () => {
  const project = ref<Project[]>([]);

  async function fetchProjects() {
    const response = await projectService.getProjects();
    if (response) project.value = response;
  }

  return {
    project,
    fetchProjects,
  };
});
