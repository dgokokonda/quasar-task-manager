<template>
  <q-layout view="hHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />
        <q-toolbar-title class="text-weight-bold"> Планировщик постпродакшена </q-toolbar-title>
        <q-space />
        <q-btn flat round dense icon="notifications" disabled />
        <q-btn flat round dense icon="account_circle" disabled />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered :breakpoint="1200">
      <q-list>
        <q-item to="/" exact clickable v-ripple>
          <q-item-section avatar>
            <q-icon name="assignment" />
          </q-item-section>
          <q-item-section>Задачи</q-item-section>
        </q-item>
        <q-item to="/projects" clickable v-ripple>
          <q-item-section avatar>
            <q-icon name="folder" />
          </q-item-section>
          <q-item-section>Проекты</q-item-section>
        </q-item>
        <q-item to="/reports" clickable v-ripple>
          <q-item-section avatar>
            <q-icon name="bar_chart" />
          </q-item-section>
          <q-item-section>Отчеты</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const leftDrawerOpen = ref(false);

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};
</script>
