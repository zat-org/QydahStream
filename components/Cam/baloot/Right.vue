<template>
  <div class="flex h-[1080px] w-[1920px] flex-col justify-between">
    <div class="flex items-center justify-between">
      <CamPlayerSlot :side="leftCam" :image-url="left?.url" />
      <CamPlayerSlot :side="topCam" :image-url="top?.url" />
    </div>
    <div class="flex items-center justify-between">
      <CamPlayerSlot :side="bottomCam" :image-url="bottom?.url" />
      <CamPlayerSlot :side="rightCam" :image-url="right?.url" />
    </div>
  </div>
</template>

<script lang="ts" setup>
const store = useMyBalootGameStore();
const { top, bottom, left, right } = storeToRefs(store);
const { topCam, bottomCam, leftCam, rightCam } = useCamThemeFrames("baloot");
</script>
