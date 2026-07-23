<template>
  <div
    v-if="imageUrl"
    class="camSlot"
    :style="{
      width: `${slotWidthPx}px`,
      height: `${slotHeightPx}px`,
    }"
  >
    <img
      class="camFrame"
      :src="frameSrc"
      :style="{
        width: `${frameWidthPx}px`,
        height: `${frameHeightPx}px`,
        left: `${frameLeftPx}px`,
        top: `${frameTopPx}px`,
      }"
    />
    <img
      class="camPhoto"
      :src="imageUrl"
      :style="{
        width: `${imageWidthPx}px`,
        height: `${imageHeightPx}px`,
        left: `${imageLeftPx}px`,
        top: `${imageTopPx}px`,
      }"
    />
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  frameSrc: string;
  imageUrl?: string | null;
  frameWidthPx: number;
  frameHeightPx: number;
  frameLeftPx: number;
  frameTopPx: number;
  imageWidthPx: number;
  imageHeightPx: number;
  imageLeftPx: number;
  imageTopPx: number;
}>();

/** Slot fits both layers so resizing frame or image only affects that layer. */
const slotWidthPx = computed(() =>
  Math.max(
    props.frameLeftPx + props.frameWidthPx,
    props.imageLeftPx + props.imageWidthPx,
    1,
  ),
);

const slotHeightPx = computed(() =>
  Math.max(
    props.frameTopPx + props.frameHeightPx,
    props.imageTopPx + props.imageHeightPx,
    1,
  ),
);
</script>

<style scoped>
.camSlot {
  @apply relative overflow-visible;
}

.camFrame {
  @apply absolute z-[10] pointer-events-none;
}

.camPhoto {
  @apply absolute object-cover object-center rounded-2xl;
}
</style>
