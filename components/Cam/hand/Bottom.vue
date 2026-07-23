<template>
  <div class="flex h-[1080px] w-[1920px] flex-col justify-between">
    <div class="flex items-center justify-between p-5">
      <CamPlayerSlot
        :frame-src="usFrameSrc"
        :image-url="top?.imageUrl"
        :frame-width-px="frameWidthPx"
        :frame-height-px="frameHeightPx"
        :frame-left-px="frameLeftPx"
        :frame-top-px="frameTopPx"
        :image-width-px="imageWidthPx"
        :image-height-px="imageHeightPx"
        :image-left-px="imageLeftPx"
        :image-top-px="imageTopPx"
      />
      <CamPlayerSlot
        :frame-src="themFrameSrc"
        :image-url="right?.imageUrl"
        :frame-width-px="frameWidthPx"
        :frame-height-px="frameHeightPx"
        :frame-left-px="frameLeftPx"
        :frame-top-px="frameTopPx"
        :image-width-px="imageWidthPx"
        :image-height-px="imageHeightPx"
        :image-left-px="imageLeftPx"
        :image-top-px="imageTopPx"
      />
    </div>
    <div class="flex items-center justify-between p-5">
      <CamPlayerSlot
        :frame-src="themFrameSrc"
        :image-url="left?.imageUrl"
        :frame-width-px="frameWidthPx"
        :frame-height-px="frameHeightPx"
        :frame-left-px="frameLeftPx"
        :frame-top-px="frameTopPx"
        :image-width-px="imageWidthPx"
        :image-height-px="imageHeightPx"
        :image-left-px="imageLeftPx"
        :image-top-px="imageTopPx"
      />
      <CamPlayerSlot
        :frame-src="usFrameSrc"
        :image-url="bottom?.imageUrl"
        :frame-width-px="frameWidthPx"
        :frame-height-px="frameHeightPx"
        :frame-left-px="frameLeftPx"
        :frame-top-px="frameTopPx"
        :image-width-px="imageWidthPx"
        :image-height-px="imageHeightPx"
        :image-left-px="imageLeftPx"
        :image-top-px="imageTopPx"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
const store = useMyHandGameStore();
const { top, bottom, left, right } = storeToRefs(store);
const {
  usFrameSrc,
  themFrameSrc,
  frameWidthPx,
  frameHeightPx,
  frameLeftPx,
  frameTopPx,
  imageWidthPx,
  imageHeightPx,
  imageLeftPx,
  imageTopPx,
} = useCamThemeFrames("hand");
</script>
