<template>
  <div
    v-if="imageUrl"
    class="camSlot"
    :style="{
      width: `${side.wrapWidthPx}px`,
      height: `${side.wrapHeightPx}px`,
      left: `${side.wrapLeftPx}px`,
      top: `${side.wrapTopPx}px`,
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

defineProps<{
  side: ResolvedCamSide;
  imageUrl?: string | null;
}>();
</script>

<style scoped>
.camSlot {
  @apply relative overflow-visible;
}

/* Beat Tailwind preflight img { max-width:100%; height:auto } so config sizes win */
.camFrame {
  @apply absolute z-[10] pointer-events-none;
  max-width: none;
  max-height: none;
  object-fit: fill;
}

.camPhoto {
  @apply absolute object-cover object-center rounded-2xl;
  max-width: none;
  max-height: none;
}
</style>
