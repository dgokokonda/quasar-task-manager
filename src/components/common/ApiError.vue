<template>
  <div v-if="error" class="api-error">
    <q-banner class="bg-negative text-white">
      <template v-slot:avatar>
        <q-icon name="error" />
      </template>
      {{ error }}
      <template v-slot:action>
        <q-btn flat color="white" label="Повторить" @click="retry" />
      </template>
    </q-banner>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  error: string | null;
  retry?: () => void;
}>();
</script>
