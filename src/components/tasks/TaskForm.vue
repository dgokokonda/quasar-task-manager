<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 600px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ isEditing ? 'Редактирование задачи' : 'Новая задача' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit">
          <UIInput
            v-model="form.name"
            label="Название задачи *"
            :rules="[(val: string) => !!val || 'Обязательное поле']"
          />

          <UISelect
            v-model="form.projectId"
            :options="projects"
            option-value="id"
            option-label="name"
            label="Проект *"
            :rules="[(val: number | null) => !!val || 'Выберите проект']"
          />

          <UISelect
            v-model="form.workType"
            :options="workTypeOptions"
            label="Тип работы *"
            option-value="id"
            option-label="name"
            :rules="[(val: WorkType | null) => !!val || 'Выберите тип работы']"
          />

          <UISelect
            v-model="form.assignees"
            :options="users"
            option-value="id"
            option-label="name"
            label="Исполнители"
            multiple
            use-chips
          />

          <UISelect
            v-model="form.priority"
            :options="priorities"
            option-value="id"
            option-label="name"
            label="Приоритет"
            :rules="[(val: string | null) => !!val || 'Выберите приоритет']"
          />

          <div class="row q-col-gutter-md">
            <div class="col-6">
              <UIInput
                v-model.number="form.plannedHours"
                type="number"
                label="Плановые часы *"
                :rules="[
                  (val: number | string) => +val > 0 || 'Должно быть больше 0',
                  (val: number | string) => Number.isInteger(val) || 'Должно быть целым числом',
                ]"
              />
            </div>
            <div class="col-6">
              <UIInput
                v-model="form.startDate"
                type="date"
                label="Дата начала *"
                :rules="[(val: string) => !!val || 'Выберите дату']"
              />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-6">
              <UISelect
                v-model="form.status"
                :options="statusOptions"
                label="Статус *"
                :rules="[(val: TaskStatus | null) => !!val || 'Выберите статус']"
              />
            </div>
            <div class="col-6">
              <UIInput
                v-model="form.endDate"
                type="date"
                label="Дата окончания *"
                :rules="[
                  (val: string) => !!val || 'Выберите дату',
                  (val: string) =>
                    new Date(val) >= new Date(form.startDate) ||
                    'Дата окончания должна быть позже даты начала',
                ]"
              />
            </div>
          </div>

          <UIInput v-model="form.description" label="Описание" type="textarea" autogrow />

          <div class="row justify-end q-gutter-sm q-pt-md">
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
import UIInput from '../common/UIInput.vue';
import UISelect from '../common/UISelect.vue';

const props = defineProps<{
  modelValue: boolean;
  task?: Task | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', task: Omit<Task, 'id'> | Partial<Task>): void;
}>();

const { projects, priorities, users, workTypeOptions, statusOptions } = useTaskFormOptions();

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
  priority: '',
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
    priority: '',
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
        priority: task.priority || '',
      };
    } else {
      resetForm();
    }
  },
  { immediate: true },
);
</script>
