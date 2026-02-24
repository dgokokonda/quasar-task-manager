<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 600px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ isEditing ? 'Редактирование задачи' : 'Новая задача' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="form.name"
            label="Название задачи *"
            :rules="[(val) => !!val || 'Обязательное поле']"
            outlined
          />

          <q-select
            v-model="form.projectId"
            :options="projects"
            option-value="id"
            option-label="name"
            label="Проект *"
            :rules="[(val) => !!val || 'Выберите проект']"
            outlined
            emit-value
            map-options
          />

          <q-select
            v-model="form.workType"
            :options="workTypeOptions"
            label="Тип работы *"
            :rules="[(val) => !!val || 'Выберите тип работы']"
            outlined
            emit-value
            map-options
          />

          <q-select
            v-model="form.assignees"
            :options="users"
            option-value="id"
            option-label="name"
            label="Исполнители"
            multiple
            outlined
            use-chips
            emit-value
            map-options
          />

          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-input
                v-model.number="form.plannedHours"
                type="number"
                label="Плановые часы *"
                :rules="[
                  (val) => val > 0 || 'Должно быть больше 0',
                  (val) => Number.isInteger(val) || 'Должно быть целым числом',
                ]"
                outlined
              />
            </div>
            <div class="col-6">
              <q-input
                v-model="form.startDate"
                type="date"
                label="Дата начала *"
                :rules="[(val) => !!val || 'Выберите дату']"
                outlined
              />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-select
                v-model="form.status"
                :options="statusOptions"
                label="Статус *"
                :rules="[(val) => !!val || 'Выберите статус']"
                outlined
                emit-value
                map-options
              />
            </div>
            <div class="col-6">
              <q-input
                v-model="form.endDate"
                type="date"
                label="Дата окончания *"
                :rules="[
                  (val) => !!val || 'Выберите дату',
                  (val) =>
                    new Date(val) >= new Date(form.startDate) ||
                    'Дата окончания должна быть позже даты начала',
                ]"
                outlined
              />
            </div>
          </div>

          <q-input v-model="form.description" label="Описание" type="textarea" outlined autogrow />

          <div class="row justify-end q-gutter-sm">
            <q-btn label="Отмена" color="grey" v-close-popup />
            <q-btn
              :label="isEditing ? 'Сохранить' : 'Создать'"
              type="submit"
              color="primary"
              :loading="submitting"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Task, WorkType, TaskStatus } from '@/types';
import { useTaskFormOptions } from '@/composables/useTaskFormOptions';

const props = defineProps<{
  modelValue: boolean;
  task?: Task | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', task: Omit<Task, 'id'> | Partial<Task>): void;
}>();

const { projects, users, workTypeOptions, statusOptions } = useTaskFormOptions();

const showDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const isEditing = computed(() => !!props.task);

const form = ref({
  name: '',
  projectId: null as number | null,
  workType: null as WorkType | null,
  assignees: [] as number[],
  plannedHours: 0,
  actualHours: 0,
  status: 'not_started' as TaskStatus,
  startDate: '',
  endDate: '',
  description: '',
});

const submitting = ref(false);

const resetForm = () => {
  form.value = {
    name: '',
    projectId: null,
    workType: null,
    assignees: [],
    plannedHours: 0,
    actualHours: 0,
    status: 'not_started',
    startDate: '',
    endDate: '',
    description: '',
  };
};

const onSubmit = () => {
  submitting.value = true;
  try {
    if (isEditing.value && props.task) {
      emit('save', { ...form.value, id: props.task.id } as Partial<Task>);
    } else {
      emit('save', form.value as Omit<Task, 'id'>);
    }
    showDialog.value = false;
  } finally {
    submitting.value = false;
  }
};

watch(
  () => props.task,
  (task) => {
    if (task) {
      form.value = {
        name: task.name,
        projectId: task.projectId,
        workType: task.workType,
        assignees: task.assignees,
        plannedHours: task.plannedHours,
        actualHours: task.actualHours,
        status: task.status,
        startDate: task.startDate,
        endDate: task.endDate,
        description: task.description || '',
      };
    } else {
      resetForm();
    }
  },
  { immediate: true },
);
</script>
