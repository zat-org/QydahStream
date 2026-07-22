<template>
  <div
    v-if="imageUrl"
    class="camSlot"
    :style="{
      width: `${widthPx}px`,
      height: `${heightPx}px`,
    }"
  >
    <img
      class="camFrame"
      :src="frameSrc"
      :style="{
        width: `${widthPx}px`,
        height: `${heightPx}px`,
      }"
    />
    <img
      class="camPhoto"
      :src="imageUrl"
      :style="{
        width: `${widthPx}px`,
        height: `${imageHeightPx}px`,
        top: `${imageTopPx}px`,
      }"
    />
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  frameSrc: string;
  imageUrl?: string | null;
  widthPx: number;
  heightPx: number;
  imageHeightPx: number;
  imageTopPx: number;
}>();
</script>

<style scoped>
.camSlot {
  @apply relative;
}

.camFrame {
  @apply absolute z-[10] left-0 top-0 pointer-events-none;
}

.camPhoto {
  @apply absolute left-0 object-cover object-center rounded-2xl;
}
</style>
