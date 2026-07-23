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
      :src="side.frameSrc"
      :style="{
        width: `${side.frameWidthPx}px`,
        height: `${side.frameHeightPx}px`,
        left: `${side.frameLeftPx}px`,
        top: `${side.frameTopPx}px`,
      }"
    />
    <img
      class="camPhoto"
      :src="imageUrl"
      :style="{
        width: `${side.imageWidthPx}px`,
        height: `${side.imageHeightPx}px`,
        left: `${side.imageLeftPx}px`,
        top: `${side.imageTopPx}px`,
      }"
    />
  </div>
</template>

<script lang="ts" setup>
import type { ResolvedCamSide } from "~/utils/cam-theme";

const props = defineProps<{
  side: ResolvedCamSide;
  imageUrl?: string | null;
}>();

/** Slot fits both layers so resizing frame or image only affects that layer. */
const slotWidthPx = computed(() =>
  Math.max(
    props.side.frameLeftPx + props.side.frameWidthPx,
    props.side.imageLeftPx + props.side.imageWidthPx,
    1,
  ),
);

const slotHeightPx = computed(() =>
  Math.max(
    props.side.frameTopPx + props.side.frameHeightPx,
    props.side.imageTopPx + props.side.imageHeightPx,
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
