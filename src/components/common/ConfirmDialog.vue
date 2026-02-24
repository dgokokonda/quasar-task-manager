<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 350px">
      <q-card-section class="row items-center q-pb-none">
        <q-icon name="warning" color="negative" size="md" />
        <span class="q-ml-sm text-h6">{{ title }}</span>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <p class="text-body1">
          Вы уверены, что хотите удалить задачу
          <span class="text-weight-bold">"{{ taskName }}"</span>?
        </p>
        <p class="text-caption text-grey">Это действие нельзя отменить.</p>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Отмена" color="grey" v-close-popup />
        <q-btn label="Удалить" color="negative" unelevated @click="confirmDelete" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  title: string;
  modelValue: boolean;
  taskName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  taskName: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
}>();

const showDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const confirmDelete = () => {
  emit('confirm');
};
</script>
