<template>
  <div class="flex h-[1080px] w-[1920px] flex-col justify-between">
    <div class="flex items-center justify-between p-5">
      <CamPlayerSlot
        :frame-src="themFrameSrc"
        :image-url="left?.url"
        :width-px="frameWidthPx"
        :height-px="frameHeightPx"
        :image-height-px="imageHeightPx"
        :image-top-px="imageTopPx"
      />
      <CamPlayerSlot
        :frame-src="usFrameSrc"
        :image-url="top?.url"
        :width-px="frameWidthPx"
        :height-px="frameHeightPx"
        :image-height-px="imageHeightPx"
        :image-top-px="imageTopPx"
      />
    </div>
    <div class="flex items-center justify-between p-5">
      <CamPlayerSlot
        :frame-src="usFrameSrc"
        :image-url="bottom?.url"
        :width-px="frameWidthPx"
        :height-px="frameHeightPx"
        :image-height-px="imageHeightPx"
        :image-top-px="imageTopPx"
      />
      <CamPlayerSlot
        :frame-src="themFrameSrc"
        :image-url="right?.url"
        :width-px="frameWidthPx"
        :height-px="frameHeightPx"
        :image-height-px="imageHeightPx"
        :image-top-px="imageTopPx"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
const store = useMyBalootGameStore();
const { top, bottom, left, right } = storeToRefs(store);
const {
  usFrameSrc,
  themFrameSrc,
  frameWidthPx,
  frameHeightPx,
  imageHeightPx,
  imageTopPx,
} = useCamThemeFrames("baloot");
</script>
