<template>
  <div class="flex h-[1080px] w-[1920px] flex-col justify-between">
    <div class="flex items-center justify-between p-5">
      <CamPlayerSlot
        :side="them"
        :image-url="left?.imageUrl"
      />
      <CamPlayerSlot
        :side="us"
        :image-url="top?.imageUrl"
      />
    </div>
    <div class="flex items-center justify-between p-5">
      <CamPlayerSlot
        :side="us"
        :image-url="bottom?.imageUrl"
      />
      <CamPlayerSlot
        :side="them"
        :image-url="right?.imageUrl"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
const store = useMyHandGameStore();
const { top, bottom, left, right } = storeToRefs(store);
const { us, them } = useCamThemeFrames("hand");
</script>
