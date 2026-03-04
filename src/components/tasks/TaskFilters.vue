<template>
  <q-card flat bordered class="q-pa-md q-mb-md">
    <q-card-section class="q-pa-none">
      <div class="text-subtitle2 text-grey-7 q-mb-sm">Фильтры</div>
      <div class="row q-col-gutter-md items-end">
        <div v-for="filter in filtersConfig" :key="filter.id" class="col-12 col-sm-6 col-md-3">
          <UIInput
            v-if="filter.type === 'text'"
            v-model="(filter.value as Ref<string>).value"
            :label="filter.label"
            :prepend-icon="filter.prependIcon"
            style="width: 250px"
            @update:model-value="handleFilterUpdate(filter.id, $event)"
          />
          <UISelect
            v-else-if="(filter.type === 'enum' || filter.type === 'multienum') && filter.options"
            v-model="(filter.value as Ref<SelectValue>).value"
            :options="filter.options"
            :prepend-icon="filter.prependIcon"
            :label="filter.label"
            :multiple="filter.type === 'multienum'"
            :use-chips="filter.type === 'multienum'"
            style="width: 250px"
            :option-value="filter.optionValue || 'id'"
            :option-label="filter.optionLabel || 'name'"
            @update:model-value="handleFilterUpdate(filter.id, $event)"
          />
        </div>
      </div>

      <div class="row q-mt-md">
        <div class="col-12 col-sm-6 col-md-2 flex gap-sm q-mt-md full-width">
          <UIButton
            label="Применить"
            color="primary"
            icon="check"
            type="submit"
            flat
            @click="emit('apply')"
          />
          <UIButton
            label="Сбросить"
            color="grey-7"
            flat
            icon="refresh"
            type="reset"
            @click="onReset"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { type Ref } from 'vue';
import UIInput from '../common/UIInput.vue';
import UISelect from '../common/UISelect.vue';
import UIButton from '../common/UIButton.vue';
import {
  useTaskFilters,
  type SelectValue,
  type TaskFiltersEmits,
  type TaskFiltersProps,
} from '@/composables/useTaskFilters';

const emit = defineEmits<TaskFiltersEmits>();
const props = defineProps<TaskFiltersProps>();

const { filtersConfig, handleFilterUpdate, onReset } = useTaskFilters(props, emit);
</script>

<style scoped>
.gap-sm {
  gap: 8px;
}
</style>
