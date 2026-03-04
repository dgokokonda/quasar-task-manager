<template>
  <div class="row items-center justify-between q-mt-md q-pa-sm">
    <div class="row items-center q-gutter-md">
      <span class="text-body2 text-grey-7">
        Показано {{ paginationFrom }}–{{ paginationTo }} из {{ totalEntries }}
      </span>
      <UISelect
        :model-value="pageSize"
        :options="pageSizeOptions"
        option-value="value"
        option-label="label"
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
import { usePagination } from '@/composables/usePagination';
import UISelect from '../common/UISelect.vue';

const {
  paginationFrom,
  paginationTo,
  totalEntries,
  totalPages,
  pageSize,
  pageSizeOptions,
  currentPage,
  onPageSizeChange,
  onPageChange,
} = usePagination();
</script>
