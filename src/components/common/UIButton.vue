<template>
  <q-btn
    :label="label"
    :type="type"
    :color="color"
    :flat="flat"
    :outline="outline"
    :round="round"
    :dense="dense"
    :size="size"
    :icon="icon"
    :disable="disable"
    :loading="loading"
    @click="emit('click', $event)"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <!-- <template v-if="$slots.icon" #icon>
      <slot name="icon" />
    </template> -->
    <template v-if="$slots.loading" #loading>
      <slot name="loading" />
    </template>
  </q-btn>
</template>

<script lang="ts" setup>
defineProps<{
  label?: string;
  type?: 'button' | 'submit' | 'reset';
  color?: string;
  flat?: boolean;
  outline?: boolean;
  round?: boolean;
  dense?: boolean;
  size?: string;
  icon?: string;
  disable?: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'click', event: Event): void;
}>();
</script>
