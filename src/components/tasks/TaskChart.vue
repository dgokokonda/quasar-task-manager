<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section>
      <div class="row items-center justify-between">
        <div class="text-h6">Распределение задач по дням</div>
        <div class="row q-gutter-sm">
          <q-btn-toggle
            v-model="chartType"
            :options="[
              { label: 'По началу', value: 'start' },
              { label: 'По окончанию', value: 'end' },
              { label: 'Активные', value: 'active' },
            ]"
            toggle-color="primary"
            dense
            outline
            option-label="label"
            option-value="value"
            emit-value
            map-options
          />
          <q-select
            v-model="dateRange"
            :options="rangeOptions"
            label="Период"
            dense
            outlined
            option-label="label"
            option-value="value"
            emit-value
            map-options
            style="min-width: 120px"
          />
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div style="height: 400px; width: 100%">
        <v-chart ref="chartRef" :option="chartOption" :loading="loading" autoresize />
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { debounce } from '@/utils/helpers';
import { useTaskChart } from '@/composables/useTaskChart';
import type { Task } from '@/types';

const props = defineProps<{
  tasks: Task[];
  loading?: boolean;
}>();

const { chartType, dateRange, rangeOptions, chartOption } = useTaskChart(props.tasks);

const chartRef = ref();

const handleResize = debounce(() => {
  if (chartRef.value?.chart) {
    chartRef.value.chart.resize();
  }
}, 200);

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  handleResize.cancel();
});

watch([() => chartOption.value, () => props.loading], () => {
  setTimeout(handleResize, 50);
});
</script>
