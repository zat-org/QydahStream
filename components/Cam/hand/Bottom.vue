<template>
  <div class="flex h-[1080px] w-[1920px] flex-col justify-between overflow-visible">
    <div class="flex items-center justify-between overflow-visible">
      <CamPlayerSlot :side="topLeftCam" :image-url="top?.imageUrl" />
      <CamPlayerSlot :side="topRightCam" :image-url="right?.imageUrl" />
    </div>
    <div class="flex items-center justify-between overflow-visible">
      <CamPlayerSlot :side="bottomLeftCam" :image-url="left?.imageUrl" />
      <CamPlayerSlot :side="bottomRightCam" :image-url="bottom?.imageUrl" />
    </div>
  </div>
</template>

<script lang="ts" setup>
const store = useMyHandGameStore();
const { top, bottom, left, right } = storeToRefs(store);
const { topLeftCam, topRightCam, bottomLeftCam, bottomRightCam } =
  useCamThemeFrames("hand");
</script>
