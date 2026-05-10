<script setup lang="ts">
import { computed } from "vue";
import type { ClientErrorEntry } from "~/utils/client-error-log";
import { clientErrorEntries } from "~/utils/client-error-log";

const rows = computed(() =>
  [...clientErrorEntries.value].slice(-40).reverse(),
);

function rowTitle(row: ClientErrorEntry) {
  const when = new Date(row.t).toISOString();
  return `${when} · ${row.category}`;
}

async function copyAll() {
  const text = JSON.stringify(clientErrorEntries.value, null, 2);
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* ignore */
  }
}

function categoryClass(category: ClientErrorEntry["category"]) {
  if (category === "chunk_reload_scheduled") return "text-amber-300";
  if (category === "chunk_reload_skipped_debounce") return "text-red-300";
  if (category === "chunk_load") return "text-amber-200";
  return "text-slate-200";
}
</script>

<template>
  <div
    class="fixed bottom-3 right-3 z-[99999] w-[min(420px,calc(100vw-24px))] max-h-[45vh] overflow-hidden rounded-lg border border-white/15 bg-black/80 text-left shadow-xl backdrop-blur"
  >
    <div
      class="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2"
    >
      <span class="text-xs font-semibold text-white">Qydah client errors</span>
      <button
        type="button"
        class="rounded bg-white/10 px-2 py-1 text-[11px] text-white hover:bg-white/20"
        @click="copyAll"
      >
        Copy JSON
      </button>
    </div>
    <div class="max-h-[38vh] overflow-auto px-2 py-2 font-mono text-[10px] leading-snug">
      <p v-if="rows.length === 0" class="text-slate-400">
        No entries yet. Long sessions after a deploy may log stale-chunk events
        here.
      </p>
      <div v-for="row in rows" :key="row.t + row.message + row.category" class="mb-2 border-b border-white/5 pb-2 last:mb-0">
        <div :class="['font-semibold', categoryClass(row.category)]">
          {{ rowTitle(row) }}
        </div>
        <div class="break-words text-slate-300">{{ row.message }}</div>
        <div v-if="row.route" class="text-slate-500">
          route: {{ row.route }}
        </div>
        <div v-if="row.extra && Object.keys(row.extra).length" class="text-slate-500">
          {{ JSON.stringify(row.extra) }}
        </div>
      </div>
    </div>
  </div>
</template>
