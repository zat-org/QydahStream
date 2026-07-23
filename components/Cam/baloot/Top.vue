<template>
  <div class="flex h-[1080px] w-[1920px] flex-col justify-between">
    <div class="flex items-center justify-between p-5">
      <CamPlayerSlot
        :key="`bottom-${bottom?.id}-${bottom?.url}`"
        :side="us"
        :image-url="bottom?.url"
      />
      <CamPlayerSlot
        :key="`left-${left?.id}-${left?.url}`"
        :side="them"
        :image-url="left?.url"
      />
    </div>
    <div class="flex items-center justify-between p-5">
      <CamPlayerSlot
        :key="`right-${right?.id}-${right?.url}`"
        :side="them"
        :image-url="right?.url"
      />
      <CamPlayerSlot
        :key="`top-${top?.id}-${top?.url}`"
        :side="us"
        :image-url="top?.url"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
const store = useMyBalootGameStore();
const { top, bottom, left, right } = storeToRefs(store);
const { us, them } = useCamThemeFrames("baloot");
</script>
