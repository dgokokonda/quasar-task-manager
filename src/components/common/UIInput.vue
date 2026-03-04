<template>
  <q-input
    filled
    :model-value="modelValue"
    :type="type"
    :label="label"
    :placeholder="placeholder"
    :hint="hint"
    :disable="disable"
    :readonly="readonly"
    :loading="loading"
    :clearable="clearable"
    :mask="mask"
    :fill-mask="fillMask"
    :unmasked-value="unmaskedValue"
    :rules="rules"
    :lazy-rules="lazyRules"
    dense
    outlined
    @update:model-value="emitUpdate"
    @blur="emit('blur')"
    @focus="emit('focus')"
  >
    <template v-if="prependIcon" #prepend>
      <q-icon :name="prependIcon" />
    </template>
    <template v-if="appendIcon" #append>
      <q-icon :name="appendIcon" class="cursor-pointer" @click="emit('append-click')" />
    </template>
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </q-input>
</template>

<script lang="ts" setup>
type InputValue = string | number | null;

withDefaults(
  defineProps<{
    modelValue: InputValue;
    label?: string;
    type?:
      | 'number'
      | 'search'
      | 'textarea'
      | 'time'
      | 'text'
      | 'date'
      | 'email'
      | 'password'
      | 'tel'
      | 'file'
      | 'url'
      | 'datetime-local'
      | undefined;
    placeholder?: string;
    hint?: string;
    disable?: boolean;
    readonly?: boolean;
    loading?: boolean;
    clearable?: boolean;
    prependIcon?: string;
    appendIcon?: string;
    mask?: string;
    fillMask?: boolean | string;
    unmaskedValue?: boolean;
    rules?: ((val: string) => boolean | string)[];
    lazyRules?: boolean;
  }>(),
  {
    type: 'text',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: InputValue): void;
  (e: 'blur'): void;
  (e: 'focus'): void;
  (e: 'append-click'): void;
}>();

const emitUpdate = (val: InputValue) => {
  emit('update:modelValue', val);
};
</script>
