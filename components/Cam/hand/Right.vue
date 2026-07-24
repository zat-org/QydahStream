<template>
  <div class="flex h-[1080px] w-[1920px] flex-col justify-between">
    <div class="flex items-center justify-between">
      <CamPlayerSlot :side="leftCam" :image-url="left?.imageUrl" />
      <CamPlayerSlot :side="topCam" :image-url="top?.imageUrl" />
    </div>
    <div class="flex items-center justify-between">
      <CamPlayerSlot :side="bottomCam" :image-url="bottom?.imageUrl" />
      <CamPlayerSlot :side="rightCam" :image-url="right?.imageUrl" />
    </div>
  </div>
</template>

<script lang="ts" setup>
const store = useMyHandGameStore();
const { top, bottom, left, right } = storeToRefs(store);
const { topCam, bottomCam, leftCam, rightCam } = useCamThemeFrames("hand");
</script>
