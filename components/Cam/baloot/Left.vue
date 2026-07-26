<template>
  <div class="flex h-[1080px] w-[1920px] flex-col justify-between overflow-hidden">
    <div class="flex items-center justify-between overflow-visible">
      <CamPlayerSlot :side="topLeftCam" :image-url="right?.url" />
      <CamPlayerSlot :side="topRightCam" :image-url="bottom?.url" />
    </div>
    <div class="flex items-center justify-between overflow-visible">
      <CamPlayerSlot :side="bottomLeftCam" :image-url="top?.url" />
      <CamPlayerSlot :side="bottomRightCam" :image-url="left?.url" />
    </div>
  </div>
</template>

<script lang="ts" setup>
const store = useMyBalootGameStore();
const { top, bottom, left, right } = storeToRefs(store);
const { topLeftCam, topRightCam, bottomLeftCam, bottomRightCam } =
  useCamThemeFrames("baloot");
</script>
