<template>
  <div
    class="pointer-events-none fixed bottom-4 left-4 z-[9999] max-w-[min(90vw,420px)] rounded-md border border-amber-600/80 bg-black/75 px-4 py-3 font-sans text-sm text-amber-100 shadow-lg"
    dir="auto"
  >
    <p class="font-semibold text-amber-50">
      {{ title }}
    </p>
    <p class="mt-1 text-xs leading-relaxed text-amber-100/90">
      {{ hint }}
    </p>
    <p class="mt-2 font-mono text-[11px] text-amber-200/80">
      theme={{ theme }} · orientation={{ orientation }}
    </p>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  title: string;
  hint: string;
  theme: string;
  orientation: string;
}>();
</script>
