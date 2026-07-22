<template>
  <div v-if="model" class="timingPreview">
    <div class="timingHead">
      <h3 class="timingTitle">Timing preview</h3>
      <span class="timingHint">read-only · wall-clock from intro start</span>
    </div>

    <div class="ruler" :style="{ paddingLeft: `${labelW}px` }">
      <div class="rulerTrack">
        <span
          v-for="tick in ticks"
          :key="`t-${tick}`"
          class="rulerTick"
          :style="{ left: `${pct(tick)}%` }"
        >
          {{ fmt(tick) }}s
        </span>
        <span
          v-for="(m, i) in uniqueMarkers"
          :key="`m-${i}-${m.at}-${m.label}`"
          class="rulerMarker"
          :style="{ left: `${pct(m.at)}%` }"
          :title="m.label"
        >
          <i class="markerLine" />
          <em class="markerLabel">{{ m.label }}</em>
        </span>
      </div>
    </div>

    <div class="lanes">
      <div v-for="lane in model.lanes" :key="lane.id" class="laneRow">
        <div class="laneLabel" :style="{ width: `${labelW}px` }">
          {{ lane.label }}
        </div>
        <div class="laneTrack">
          <div
            class="laneBar"
            :style="{
              left: `${pct(lane.start)}%`,
              width: `${Math.max(pct(lane.end) - pct(lane.start), 0.4)}%`,
              background: lane.color,
            }"
            :title="`${lane.label}: ${fmt(lane.start)}s → ${fmt(lane.end)}s`"
          >
            <span class="barText">
              {{ fmt(lane.start) }}–{{ fmt(lane.end) }}s
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="model.overlaps.length" class="overlaps">
      <p class="overlapsTitle">Overlaps</p>
      <ul>
        <li v-for="(o, i) in model.overlaps" :key="`o-${i}`">
          <span class="overlapNote">{{ o.note }}</span>
          <span class="overlapMeta">
            {{ fmt(o.start) }}s–{{ fmt(o.end) }}s ({{ fmt(o.seconds) }}s)
          </span>
        </li>
      </ul>
    </div>
    <p v-else class="noOverlap">No overlapping events</p>
  </div>
</template>

<script lang="ts" setup>
import type {
  LandscapeDetailConfig,
  LandscapeScoreConfig,
  LandscapeWinnerConfig,
  ScreenId,
} from "~/config/themes/types";
import {
  buildTimingTimeline,
  fmt,
  type TimingTimelineModel,
} from "~/utils/timing-timeline";

const props = defineProps<{
  screen: ScreenId;
  config:
    | LandscapeScoreConfig
    | LandscapeDetailConfig
    | LandscapeWinnerConfig
    | null;
}>();

const labelW = 128;

const model = computed<TimingTimelineModel | null>(() =>
  buildTimingTimeline(props.screen, props.config),
);

function pct(sec: number): number {
  const total = model.value?.totalSec ?? 1;
  return Math.min(100, Math.max(0, (sec / total) * 100));
}

const ticks = computed(() => {
  const total = model.value?.totalSec ?? 1;
  const step = total <= 4 ? 0.5 : total <= 10 ? 1 : 2;
  const out: number[] = [];
  for (let t = 0; t <= total + 0.001; t += step) {
    out.push(Math.round(t * 100) / 100);
  }
  if (out[out.length - 1] !== Math.round(total * 100) / 100) {
    out.push(Math.round(total * 100) / 100);
  }
  return out;
});

const uniqueMarkers = computed(() => {
  const list = model.value?.markers ?? [];
  const seen = new Set<string>();
  return list.filter((m) => {
    const key = `${m.at}:${m.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
});
</script>

<style scoped>
.timingPreview {
  @apply mt-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3;
}

.timingHead {
  @apply mb-3 flex flex-wrap items-baseline justify-between gap-2;
}

.timingTitle {
  @apply m-0 text-xs font-semibold text-zinc-200;
}

.timingHint {
  @apply text-[10px] text-zinc-500;
}

.ruler {
  @apply mb-2;
}

.rulerTrack {
  @apply relative h-5 border-b border-zinc-800;
}

.rulerTick {
  @apply absolute top-0 -translate-x-1/2 text-[9px] text-zinc-500;
}

.rulerMarker {
  @apply absolute top-0 h-full -translate-x-1/2;
}

.markerLine {
  @apply absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-amber-500/70;
}

.markerLabel {
  @apply absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap text-[9px] not-italic text-amber-400/90;
}

.lanes {
  @apply mt-4 space-y-1.5;
}

.laneRow {
  @apply flex items-center gap-0;
}

.laneLabel {
  @apply shrink-0 truncate pr-2 text-[10px] text-zinc-400;
}

.laneTrack {
  @apply relative h-6 flex-1 rounded bg-zinc-900/80;
}

.laneBar {
  @apply absolute top-0.5 bottom-0.5 flex min-w-[2px] items-center overflow-hidden rounded px-1;
  opacity: 0.92;
}

.barText {
  @apply truncate text-[9px] font-medium text-white/90;
}

.overlaps {
  @apply mt-3 border-t border-zinc-800 pt-2;
}

.overlapsTitle {
  @apply mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400;
}

.overlaps ul {
  @apply m-0 list-none space-y-1 p-0;
}

.overlaps li {
  @apply flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[11px];
}

.overlapNote {
  @apply text-zinc-200;
}

.overlapMeta {
  @apply text-zinc-500;
}

.noOverlap {
  @apply mt-3 border-t border-zinc-800 pt-2 text-[10px] text-zinc-600;
}
</style>
