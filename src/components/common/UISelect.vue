<template>
  <q-select
    filled
    v-model="selectedValue"
    :options="options"
    :multiple="multiple"
    :option-value="optionValue"
    :option-label="optionLabel"
    :label="label"
    emit-value
    map-options
    dense
    outlined
    :clearable="clearable"
    :use-chips="multiple && useChips"
    @update:model-value="emitUpdate"
  >
    <template v-if="prependIcon" #prepend>
      <q-icon :name="prependIcon" />
    </template>
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </q-select>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

type SelectValue = string | number | (string | number)[] | null;
type SelectOption = Record<string, unknown> | string | number;

const props = withDefaults(
  defineProps<{
    modelValue: SelectValue;
    options: SelectOption[];
    label?: string;
    prependIcon?: string;
    multiple?: boolean;
    clearable?: boolean;
    useChips?: boolean;
    optionValue?: string;
    optionLabel?: string;
  }>(),
  {
    multiple: false,
    clearable: false,
    useChips: false,
    optionValue: 'id',
    optionLabel: 'name',
    prependIcon: '',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: SelectValue): void;
}>();

const selectedValue = computed({
  get: () => props.modelValue,
  set: (val) => emitUpdate(val),
});

const emitUpdate = (val: unknown) => {
  if (props.multiple) {
    emit('update:modelValue', (val || []) as (string | number)[]);
  } else {
    emit('update:modelValue', (val as string | number | null) ?? null);
  }
};
</script>
