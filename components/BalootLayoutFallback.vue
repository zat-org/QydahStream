<template>
  <LayoutFallback
    :title="title"
    :hint="hint"
    :theme="theme"
    :orientation="orientation"
  />
</template>

<script lang="ts" setup>
import LayoutFallback from "./LayoutFallback.vue";

defineProps<{
  title: string;
  hint: string;
  theme: string;
  orientation: string;
}>();
</script>
