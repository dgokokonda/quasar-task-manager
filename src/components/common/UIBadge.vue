<template>
  <q-badge
    :color="color"
    :outline="outline"
    :floating="floating"
    :multiline="multiline"
    :label="label"
    :align="badgeAlign"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </q-badge>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
  color?: string;
  outline?: boolean;
  floating?: boolean;
  multiline?: boolean;
  label?: string | number;
  align?: 'top' | 'bottom' | 'left' | 'right';
}>();

const badgeAlign = computed(() => {
  if (props.align === 'left' || props.align === 'right') {
    return 'middle' as const;
  }
  return props.align;
});
</script>
