<template>
  <div class="flex h-[1080px] w-[1920px] flex-col justify-between">
    <div class="flex items-center justify-between p-5">
      <CamPlayerSlot
        :side="them"
        :image-url="left?.url"
      />
      <CamPlayerSlot
        :side="us"
        :image-url="top?.url"
      />
    </div>
    <div class="flex items-center justify-between p-5">
      <CamPlayerSlot
        :side="us"
        :image-url="bottom?.url"
      />
      <CamPlayerSlot
        :side="them"
        :image-url="right?.url"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
const store = useMyBalootGameStore();
const { top, bottom, left, right } = storeToRefs(store);
const { us, them } = useCamThemeFrames("baloot");
</script>
