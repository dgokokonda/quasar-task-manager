<template>
  <q-card flat bordered class="q-pa-md q-mb-md">
    <q-card-section class="q-pa-none">
      <div class="text-subtitle2 text-grey-7 q-mb-sm">Фильтры</div>
      <div class="row q-col-gutter-md items-end">
        <div class="col-12 col-sm-6 col-md-3">
          <q-input
            filled
            v-model="search"
            label="Поиск по названию задачи"
            lazy-rules
            emit-value
            dense
            outlined
            style="width: 250px"
            @update:model-value="emit('update:search', search)"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            filled
            v-model="statuses"
            :options="statusOptions"
            multiple
            option-value="id"
            option-label="name"
            label="Статус задачи"
            style="width: 250px"
            emit-value
            map-options
            dense
            outlined
            @update:model-value="emit('update:statuses', statuses)"
          >
            <template #prepend>
              <q-icon name="flag" />
            </template>
          </q-select>
        </div>

        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            filled
            v-model="workType"
            multiple
            option-value="id"
            option-label="name"
            :options="workTypeOptions"
            label="Тип работы"
            style="width: 250px"
            emit-value
            map-options
            dense
            outlined
            @update:model-value="emit('update:workType', workType)"
          >
            <template #prepend>
              <q-icon name="work" />
            </template>
          </q-select>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            filled
            v-model="assignee"
            multiple
            option-value="id"
            option-label="name"
            :options="assigneeOptions"
            label="Исполнитель"
            style="width: 250px"
            emit-value
            map-options
            dense
            outlined
            @update:model-value="emit('update:assignee', assignee)"
          >
            <template #prepend>
              <q-icon name="person" />
            </template>
          </q-select>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            filled
            v-model="sortBy"
            :options="sortByOptions"
            option-value="id"
            option-label="name"
            label="Сортировка по полю"
            style="width: 250px"
            emit-value
            map-options
            dense
            outlined
            @update:model-value="emit('update:sortBy', sortBy)"
          >
            <template #prepend>
              <q-icon name="reorder" />
            </template>
          </q-select>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            filled
            v-model="sortOrder"
            :options="sortOrderOptions"
            option-value="id"
            option-label="name"
            label="Порядок сортировки"
            style="width: 250px"
            emit-value
            map-options
            dense
            outlined
            @update:model-value="emit('update:sortOrder', sortOrder)"
          >
            <template #prepend>
              <q-icon name="swap_vert" />
            </template>
          </q-select>
        </div>
      </div>
      <div class="col-12 col-sm-6 col-md-2 flex gap-sm q-mt-md">
        <q-btn
          type="submit"
          flat
          color="primary"
          label="Применить"
          icon="check"
          @click="emit('apply')"
        ></q-btn>
        <q-btn
          type="reset"
          flat
          color="grey-7"
          label="Сбросить"
          icon="refresh"
          @click="onReset"
        ></q-btn>
      </div>
    </q-card-section>
  </q-card>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import type { WorkType, TaskStatus } from '@/types';
import { MOCK_USERS, STATUS_LABELS, WORK_TYPE_LABELS } from '@/utils/constants';

const emit = defineEmits<{
  (e: 'update:search', value: string): void;
  (e: 'update:statuses', value: TaskStatus[]): void;
  (e: 'update:workType', value: WorkType[]): void;
  (e: 'update:assignee', value: number[]): void;
  (e: 'update:sortOrder', value: string): void;
  (e: 'update:sortBy', value: string): void;
  (e: 'apply'): void;
  (e: 'reset'): void;
}>();

const props = defineProps<{
  search: string;
  statuses: TaskStatus[];
  workType: WorkType[];
  assignee: number[];
  sortBy:
    | 'name'
    | 'startDate'
    | 'endDate'
    | 'plannedHours'
    | 'actualHours'
    | 'order'
    | 'workType'
    | 'status';
  sortOrder: 'asc' | 'desc';
}>();

const search = ref<string>(props.search);
const statuses = ref<TaskStatus[]>(props.statuses);
const workType = ref<WorkType[]>(props.workType);
const assignee = ref<number[]>(props.assignee);
const sortOrder = ref(props.sortOrder);
const sortBy = ref(props.sortBy);

const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  id: value as TaskStatus,
  name: label,
}));

const workTypeOptions = Object.entries(WORK_TYPE_LABELS).map(([value, label]) => ({
  id: value as WorkType,
  name: label,
}));

const assigneeOptions = MOCK_USERS;

const sortByOptions = Object.entries({
  // workType: 'Тип работы',
  name: 'Название задачи',
  // status: 'Статус',
  startDate: 'Дата начала',
  endDate: 'Дата окончания',
  plannedHours: 'Плановые часы',
  actualHours: 'Фактические часы',
  order: 'Порядок',
}).map(([value, label]) => ({
  id: value as WorkType,
  name: label,
}));

const sortOrderOptions = Object.entries({
  asc: 'Восходящая',
  desc: 'Нисходящая',
}).map(([value, label]) => ({
  id: value as WorkType,
  name: label,
}));

watch(
  () => [
    props.search,
    props.statuses,
    props.workType,
    props.assignee,
    props.sortBy,
    props.sortOrder,
  ],
  () => {
    search.value = props.search;
    statuses.value = [...props.statuses];
    workType.value = [...props.workType];
    assignee.value = [...props.assignee];
    sortBy.value = props.sortBy;
    sortOrder.value = props.sortOrder;
  },
  { immediate: true },
);

const onReset = () => {
  search.value = '';
  statuses.value = [];
  workType.value = [];
  assignee.value = [];
  sortBy.value = 'name';
  sortOrder.value = 'asc';
  emit('update:search', '');
  emit('update:statuses', []);
  emit('update:workType', []);
  emit('update:assignee', []);
  emit('update:sortBy', 'name');
  emit('update:sortOrder', 'asc');
  emit('reset');
};
</script>
<style scoped>
.gap-sm {
  gap: 8px;
}
</style>
