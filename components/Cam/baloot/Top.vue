<template>
  <div class="flex h-[1080px] w-[1920px] flex-col justify-between">
    <div class="flex items-center justify-between">
      <CamPlayerSlot
        :key="`bottom-${bottom?.id}-${bottom?.url}`"
        :side="bottomCam"
        :image-url="bottom?.url"
      />
      <CamPlayerSlot
        :key="`left-${left?.id}-${left?.url}`"
        :side="leftCam"
        :image-url="left?.url"
      />
    </div>
    <div class="flex items-center justify-between">
      <CamPlayerSlot
        :key="`right-${right?.id}-${right?.url}`"
        :side="rightCam"
        :image-url="right?.url"
      />
      <CamPlayerSlot
        :key="`top-${top?.id}-${top?.url}`"
        :side="topCam"
        :image-url="top?.url"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
const store = useMyBalootGameStore();
const { top, bottom, left, right } = storeToRefs(store);
const { topCam, bottomCam, leftCam, rightCam } = useCamThemeFrames("baloot");
</script>
