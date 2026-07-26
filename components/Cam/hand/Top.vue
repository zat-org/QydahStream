<template>
  <div class="flex h-[1080px] w-[1920px] flex-col justify-between overflow-hidden">
    <div class="flex items-center justify-between overflow-visible">
      <CamPlayerSlot :side="topLeftCam" :image-url="bottom?.imageUrl" />
      <CamPlayerSlot :side="topRightCam" :image-url="left?.imageUrl" />
    </div>
    <div class="flex items-center justify-between overflow-visible">
      <CamPlayerSlot :side="bottomLeftCam" :image-url="right?.imageUrl" />
      <CamPlayerSlot :side="bottomRightCam" :image-url="top?.imageUrl" />
    </div>
  </div>
</template>

<script lang="ts" setup>
const store = useMyHandGameStore();
const { top, bottom, left, right } = storeToRefs(store);
const { topLeftCam, topRightCam, bottomLeftCam, bottomRightCam } =
  useCamThemeFrames("hand");
</script>
