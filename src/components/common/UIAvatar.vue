<template>
  <q-avatar
    :size="size"
    :color="color"
    :text-color="textColor"
    :icon="icon"
    :rounded="rounded"
    :font-size="fontSize"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </q-avatar>
</template>

<script lang="ts" setup>
defineProps<{
  size?: string;
  color?: string;
  textColor?: string;
  icon?: string;
  rounded?: boolean;
  fontSize?: string;
}>();
</script>
