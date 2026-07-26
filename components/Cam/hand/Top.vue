<template>
  <div class="flex h-[1080px] w-[1920px] flex-col justify-between overflow-hidden">
    <div class="flex items-center justify-between overflow-visible">
      <CamPlayerSlot :side="topLeftCam" :image-url="left?.imageUrl" />
      <CamPlayerSlot :side="topRightCam" :image-url="top?.imageUrl" />
    </div>
    <div class="flex items-center justify-between overflow-visible">
      <CamPlayerSlot :side="bottomLeftCam" :image-url="bottom?.imageUrl" />
      <CamPlayerSlot :side="bottomRightCam" :image-url="right?.imageUrl" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useCamThemeFrames } from '~/composables/useCamThemeFrames';

const store = useMyHandGameStore();
const { top, bottom, left, right } = storeToRefs(store);
const { topLeftCam, topRightCam, bottomLeftCam, bottomRightCam } =
  useCamThemeFrames("hand");
</script>
