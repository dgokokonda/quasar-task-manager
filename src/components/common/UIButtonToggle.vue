<template>
  <q-btn-toggle
    :model-value="modelValue"
    :options="processedOptions"
    :toggle-color="toggleColor"
    :dense="dense"
    :outline="outline"
    :unelevated="unelevated"
    :no-caps="noCaps"
    :spread="spread"
    :rounded="rounded"
    :push="push"
    :stack="stack"
    :no-wrap="noWrap"
    :glossy="glossy"
    :clearable="clearable"
    :size="size"
    :disable="disable"
    :readonly="readonly"
    @update:model-value="emitUpdate"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

export type ToggleOption = {
  label: string;
  value: string | number | boolean;
  slot?: string;
  icon?: string;
  disable?: boolean;
};

const props = withDefaults(
  defineProps<{
    modelValue: string | number | boolean | null;
    options: (ToggleOption | string | number)[];
    toggleColor?: string;
    dense?: boolean;
    outline?: boolean;
    unelevated?: boolean;
    noCaps?: boolean;
    spread?: boolean;
    rounded?: boolean;
    push?: boolean;
    stack?: boolean;
    noWrap?: boolean;
    glossy?: boolean;
    clearable?: boolean;
    size?: string;
    disable?: boolean;
    readonly?: boolean;
    optionLabel?: string;
    optionValue?: string;
  }>(),
  {
    toggleColor: 'primary',
    dense: false,
    outline: false,
    unelevated: false,
    noCaps: false,
    spread: false,
    rounded: false,
    push: false,
    stack: false,
    noWrap: false,
    glossy: false,
    clearable: false,
    size: 'md',
    disable: false,
    readonly: false,
    optionLabel: 'label',
    optionValue: 'value',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | boolean | null): void;
}>();

const processedOptions = computed(() => {
  return props.options.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return {
        label: String(opt),
        value: opt,
      };
    }
    return opt;
  });
});

const emitUpdate = (value: string | number | boolean | null) => {
  emit('update:modelValue', value);
};
</script>
