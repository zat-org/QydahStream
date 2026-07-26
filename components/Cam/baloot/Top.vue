<template>
  <div class="flex h-[1080px] w-[1920px] flex-col justify-between overflow-hidden">
    <div class="flex items-center justify-between overflow-visible">
      <CamPlayerSlot
        :key="`left-${left?.id}-${left?.url}`"
        :side="topLeftCam"
        :image-url="left?.url"
      />
      <CamPlayerSlot
        :key="`top-${top?.id}-${top?.url}`"
        :side="topRightCam"
        :image-url="top?.url"
      />
    </div>
    <div class="flex items-center justify-between overflow-visible">
      <CamPlayerSlot
        :key="`bottom-${bottom?.id}-${bottom?.url}`"
        :side="bottomLeftCam"
        :image-url="bottom?.url"
      />
      <CamPlayerSlot
        :key="`right-${right?.id}-${right?.url}`"
        :side="bottomRightCam"
        :image-url="right?.url"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useCamThemeFrames } from '~/composables/useCamThemeFrames';

const store = useMyBalootGameStore();
const { top, bottom, left, right } = storeToRefs(store);
const { topLeftCam, topRightCam, bottomLeftCam, bottomRightCam } =
  useCamThemeFrames("baloot");
</script>
