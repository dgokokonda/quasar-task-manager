<template>
  <div class="row items-center justify-between q-mt-md q-pa-sm">
    <div class="row items-center q-gutter-md">
      <span class="text-body2 text-grey-7">
        Показано {{ paginationFrom }}–{{ paginationTo }} из {{ totalEntries }}
      </span>
      <q-select
        :model-value="pageSize"
        :options="pageSizeOptions"
        dense
        outlined
        emit-value
        map-options
        options-dense
        style="min-width: 70px"
        @update:model-value="onPageSizeChange"
      />
    </div>
    <q-pagination
      :model-value="currentPage"
      :max="totalPages"
      :max-pages="7"
      direction-links
      boundary-links
      color="primary"
      @update:model-value="onPageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTasks } from '@/composables/useTasks';

const { pagination, setPage, setPageLimit, fetchTasks } = useTasks();
const route = useRoute();
const router = useRouter();

const currentPage = computed({
  get: () => pagination.value.page,
  set: (value) => setPage(value),
});

const pageSize = computed({
  get: () => pagination.value.limit,
  set: (value) => setPageLimit(value),
});

const pageSizeOptions = [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
];

const totalPages = computed(() => pagination.value.total);
const totalEntries = computed(() => pagination.value.totalEntries);

const paginationFrom = computed(() => {
  if (totalEntries.value === 0) return 0;
  return (currentPage.value - 1) * pageSize.value + 1;
});

const paginationTo = computed(() => {
  const to = currentPage.value * pageSize.value;
  return Math.min(to, totalEntries.value);
});

const updateUrlParams = async () => {
  const query = { ...route.query };

  if (currentPage.value === 1) {
    delete query.page;
  } else {
    query.page = String(currentPage.value);
  }

  if (pageSize.value === 20) {
    delete query.limit;
  } else {
    query.limit = String(pageSize.value);
  }

  await router.replace({ query });
};

const onPageSizeChange = async (value: number) => {
  setPageLimit(value);
  setPage(1);
  await updateUrlParams();
  await fetchTasks();
};

const onPageChange = async (value: number) => {
  setPage(value);
  await updateUrlParams();
  await fetchTasks();
};
</script>
