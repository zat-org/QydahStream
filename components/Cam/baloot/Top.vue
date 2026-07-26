<template>
  <div class="flex h-[1080px] w-[1920px] flex-col justify-between overflow-hidden">
    <div class="flex items-center justify-between overflow-visible">
      <CamPlayerSlot
        :key="`top-${top?.id}-${top?.url}`"
        :side="topLeftCam"
        :image-url="top?.url"
      />
      <CamPlayerSlot
        :key="`left-${left?.id}-${left?.url}`"
        :side="topRightCam"
        :image-url="left?.url"
      />
    </div>
    <div class="flex items-center justify-between overflow-visible">
      <CamPlayerSlot
        :key="`right-${right?.id}-${right?.url}`"
        :side="bottomLeftCam"
        :image-url="right?.url"
      />
      <CamPlayerSlot
        :key="`bottom-${bottom?.id}-${bottom?.url}`"
        :side="bottomRightCam"
        :image-url="bottom?.url"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
const store = useMyBalootGameStore();
const { top, bottom, left, right } = storeToRefs(store);
const { topLeftCam, topRightCam, bottomLeftCam, bottomRightCam } =
  useCamThemeFrames("baloot");
</script>
