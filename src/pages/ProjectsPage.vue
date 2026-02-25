<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h5">Управление проектами</div>
      </div>
      <div class="col-auto">
        <q-btn label="Новая задача" icon="add" disabled color="primary" @click="showCreateDialog" />
      </div>
    </div>
    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="3em" />
    </div>

    <template v-else>
      <div class="projects">
        <div class="project q-mb-sm" v-for="project in projects" :key="project.id">
          <div>Проект: {{ project.name }}</div>
          <div>Код проекта: {{ project.code }}</div>
        </div>
      </div>
    </template>
  </q-page>
</template>
<script lang="ts" setup>
import { onMounted } from 'vue';
import { useProjectStore } from '@/stores/projectStore';
import { storeToRefs } from 'pinia';

const store = useProjectStore();
const { projects, loading } = storeToRefs(store);
const showCreateDialog = () => {};

onMounted(async () => await store.fetchProjects());
</script>
