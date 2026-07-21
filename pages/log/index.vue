<template>
  <div class="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100">
    <div class="mx-auto max-w-6xl">
      <header class="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-xl font-semibold tracking-tight">Debug logs</h1>
          <p class="mt-1 text-xs text-zinc-400">
            Live · running games first · event diffs · RTDB
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span
            v-if="unlocked"
            class="inline-flex items-center gap-1.5 font-mono text-[11px]"
            :class="liveOk ? 'text-emerald-400' : 'text-zinc-500'"
          >
            <span
              class="h-1.5 w-1.5 rounded-full"
              :class="
                liveOk
                  ? 'animate-pulse bg-emerald-400'
                  : 'bg-zinc-600'
              "
            />
            {{ liveOk ? "live" : "offline" }}
          </span>
          <p class="font-mono text-[11px] text-zinc-500">
            this build: {{ appEnv }}
          </p>
        </div>
      </header>

      <form
        v-if="!unlocked"
        class="mx-auto max-w-sm rounded-lg border border-zinc-700 bg-zinc-900 p-5"
        @submit.prevent="unlock"
      >
        <label class="block text-sm text-zinc-300" for="log-password">
          Password
        </label>
        <input
          id="log-password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          class="mt-2 w-full rounded border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-emerald-600"
        />
        <p v-if="authError" class="mt-2 text-xs text-red-400">{{ authError }}</p>
        <button
          type="submit"
          class="mt-4 w-full rounded bg-emerald-700 px-3 py-2 text-sm font-medium hover:bg-emerald-600"
        >
          Unlock
        </button>
      </form>

      <template v-else>
        <div
          class="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 p-3 text-sm"
        >
          <select
            v-model="filterEnv"
            class="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs"
          >
            <option value="">all envs</option>
            <option value="development">development</option>
            <option value="staging">staging</option>
            <option value="production">production</option>
            <option value="preview">preview</option>
          </select>
          <select
            v-model="filterType"
            class="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs"
          >
            <option value="">all types</option>
            <option value="error">error</option>
            <option value="connect">connect</option>
            <option value="reconnect">reconnect</option>
            <option value="disconnect">disconnect</option>
            <option value="join">join</option>
            <option value="score">score</option>
            <option value="names">names</option>
            <option value="game_event">game_event</option>
          </select>
          <input
            v-model="filterGameId"
            type="search"
            placeholder="game id…"
            class="min-w-[10rem] flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs"
          />
          <input
            v-model="filterTable"
            type="search"
            placeholder="table id…"
            class="min-w-[10rem] flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs"
          />
          <label class="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <input v-model="hubOnly" type="checkbox" class="rounded border-zinc-600" />
            hub events only
          </label>
          <label class="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <input
              v-model="liveOnly"
              type="checkbox"
              class="rounded border-zinc-600"
            />
            running only
          </label>
          <button
            type="button"
            class="rounded bg-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-600"
            :disabled="loading"
            @click="reconnectLive"
          >
            {{ loading ? "Connecting…" : "Reconnect" }}
          </button>
          <button
            type="button"
            class="rounded bg-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-600"
            @click="expandAll"
          >
            Expand all
          </button>
          <button
            type="button"
            class="rounded bg-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-600"
            @click="collapseAll"
          >
            Collapse all
          </button>
          <button
            type="button"
            class="rounded bg-red-900/80 px-3 py-1.5 text-xs text-red-100 hover:bg-red-800 disabled:opacity-50"
            :disabled="clearing || loading"
            @click="clearLogs"
          >
            {{ clearing ? "Clearing…" : "Clear logs" }}
          </button>
          <button
            type="button"
            class="rounded bg-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-600"
            @click="copyJson"
          >
            Copy JSON
          </button>
          <button
            type="button"
            class="rounded bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-700"
            @click="lock"
          >
            Lock
          </button>
        </div>

        <p v-if="loadError" class="mb-3 text-sm text-red-400">{{ loadError }}</p>
        <p class="mb-3 text-xs text-zinc-500">
          <span v-if="liveCount" class="text-emerald-400"
            >{{ liveCount }} running ·
          </span>
          {{ groups.length }} game group(s) · {{ filtered.length }} event(s) /
          {{ rows.length }} loaded
          <span class="text-zinc-600"> · auto-updates</span>
        </p>

        <div
          v-if="filtered.length === 0"
          class="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-10 text-center text-sm text-zinc-500"
        >
          No logs yet. Open a board page so events are written to Firebase.
        </div>

        <div v-else class="space-y-3">
          <section
            v-for="group in groups"
            :key="group.key"
            class="overflow-hidden rounded-xl border"
            :class="
              group.isLive
                ? 'border-emerald-500/70 bg-emerald-950/25 shadow-[0_0_0_1px_rgba(16,185,129,0.15)]'
                : 'border-zinc-800 bg-zinc-900/60'
            "
          >
            <button
              type="button"
              class="flex w-full items-center gap-3 px-4 py-3 text-left"
              :class="
                group.isLive
                  ? 'bg-emerald-950/40 hover:bg-emerald-950/55'
                  : 'hover:bg-zinc-900'
              "
              @click="toggleGroup(group.key)"
            >
              <span
                class="font-mono text-sm"
                :class="group.isLive ? 'text-emerald-400' : 'text-zinc-500'"
              >
                {{ collapsed[group.key] ? "▸" : "▾" }}
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    v-if="group.isLive"
                    class="inline-flex items-center gap-1 rounded-full border border-emerald-500/50 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300"
                  >
                    <span
                      class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"
                    />
                    Running
                  </span>
                  <span
                    class="rounded px-2 py-0.5 font-mono text-[11px]"
                    :class="
                      group.isLive
                        ? 'bg-emerald-800/50 text-emerald-200'
                        : 'bg-zinc-800 text-zinc-400'
                    "
                  >
                    game {{ shortId(group.key) }}
                  </span>
                  <span
                    v-if="group.game"
                    class="rounded px-1.5 py-0.5 text-[10px] uppercase"
                    :class="
                      group.isLive
                        ? 'bg-emerald-900/60 text-emerald-300'
                        : 'bg-zinc-800 text-zinc-500'
                    "
                  >
                    {{ group.game }}
                  </span>
                  <span class="text-[11px] text-zinc-500">
                    {{ group.events.length }} events
                  </span>
                  <span v-if="group.tableId" class="text-[11px] text-zinc-500">
                    table {{ shortId(group.tableId) }}
                  </span>
                  <span v-if="group.theme" class="text-[11px] text-zinc-500">
                    {{ group.theme }}/{{ group.orientation ?? "?" }}
                  </span>
                  <span
                    v-if="group.appEnv"
                    class="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    :class="envBadge(group.appEnv)"
                  >
                    {{ group.appEnv }}
                  </span>
                </div>
                <p
                  class="mt-0.5 truncate font-mono text-[10px]"
                  :class="group.isLive ? 'text-emerald-500/60' : 'text-zinc-600'"
                >
                  {{ group.key }}
                </p>
                <p
                  v-if="group.scoreLabel"
                  class="mt-1 font-mono text-[10px]"
                  :class="group.isLive ? 'text-emerald-200/80' : 'text-zinc-500'"
                >
                  {{ group.scoreLabel }}
                </p>
              </div>
              <div class="shrink-0 text-right">
                <span
                  class="block text-[10px]"
                  :class="group.isLive ? 'text-emerald-400' : 'text-zinc-500'"
                >
                  {{ formatTime(group.latestT) }}
                </span>
                <span
                  v-if="group.isLive"
                  class="mt-0.5 block text-[9px] text-emerald-500/80"
                >
                  {{ relativeAgo(group.latestT) }}
                </span>
              </div>
            </button>

            <ol
              v-show="!collapsed[group.key]"
              class="divide-y border-t"
              :class="
                group.isLive
                  ? 'divide-emerald-900/40 border-emerald-800/50'
                  : 'divide-zinc-800/80 border-zinc-800'
              "
            >
              <li
                v-for="(row, idx) in group.events"
                :key="row.id"
                class="px-4 py-3"
                :class="
                  group.isLive ? 'hover:bg-emerald-950/30' : 'hover:bg-zinc-950/50'
                "
              >
                <div class="flex flex-wrap items-start gap-2">
                  <span
                    class="mt-0.5 inline-flex h-5 min-w-[2rem] items-center justify-center rounded px-1.5 font-mono text-[10px] font-semibold"
                    :class="
                      group.isLive
                        ? 'bg-emerald-900/60 text-emerald-200'
                        : 'bg-zinc-800 text-zinc-300'
                    "
                  >
                    #{{ row.eventSeq ?? idx + 1 }}
                  </span>
                  <div class="min-w-0 flex-1 space-y-1.5">
                    <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span
                        class="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                        :class="envBadge(row.appEnv)"
                      >
                        {{ row.appEnv || "?" }}
                      </span>
                      <span class="text-[10px] text-zinc-500">{{
                        formatTime(row.t)
                      }}</span>
                      <span
                        class="rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
                        :class="levelBadge(row.level)"
                      >
                        {{ row.level }}
                      </span>
                      <span
                        class="rounded px-1.5 py-0.5 text-[10px]"
                        :class="typeBadge(row.type)"
                      >
                        {{ row.type }}
                      </span>
                    </div>

                    <!-- Hub event names -->
                    <div
                      v-if="hubNames(row).length"
                      class="flex flex-wrap gap-1"
                    >
                      <span
                        v-for="name in hubNames(row)"
                        :key="name"
                        class="rounded-full border border-cyan-800/60 bg-cyan-950/40 px-2 py-0.5 text-[10px] font-medium text-cyan-200"
                      >
                        {{ name }}
                      </span>
                    </div>
                    <p v-else class="text-[11px] text-zinc-300">
                      {{ row.message }}
                    </p>

                    <p
                      v-if="hubNames(row).length && row.message"
                      class="text-[10px] text-zinc-500"
                    >
                      {{ row.message }}
                    </p>

                    <!-- Field changes -->
                    <div
                      v-if="rowChanges(row).length"
                      class="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/80"
                    >
                      <div
                        class="border-b border-zinc-800 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500"
                      >
                        Fields updated ({{ rowChanges(row).length }})
                      </div>
                      <ul class="max-h-48 overflow-auto font-mono text-[10px]">
                        <li
                          v-for="ch in rowChanges(row)"
                          :key="ch.field"
                          class="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 border-b border-zinc-900 px-2 py-1 last:border-0"
                        >
                          <span class="truncate text-amber-200/90">{{
                            ch.field
                          }}</span>
                          <span class="truncate text-red-300/80">{{
                            formatChangeValue(ch.from)
                          }}</span>
                          <span class="truncate text-emerald-300/90"
                            >→ {{ formatChangeValue(ch.to) }}</span
                          >
                        </li>
                      </ul>
                    </div>
                    <p
                      v-else-if="hubNames(row).length"
                      class="text-[10px] italic text-zinc-600"
                    >
                      No field diffs vs previous board snapshot
                    </p>

                    <!-- Compact score glance (lean payload) -->
                    <div
                      v-if="scorePreviewLabel(row)"
                      class="rounded border border-zinc-800 bg-zinc-950/50 px-2 py-1 font-mono text-[10px] text-zinc-400"
                    >
                      <span class="text-zinc-500">scores </span>
                      {{ scorePreviewLabel(row) }}
                    </div>

                    <!-- Machine state chip -->
                    <div
                      v-if="machineLabel(row)"
                      class="text-[10px] text-zinc-500"
                    >
                      machine:
                      <span class="text-violet-300">{{ machineLabel(row) }}</span>
                    </div>

                    <button
                      v-if="row.payload"
                      type="button"
                      class="text-[10px] text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
                      @click="toggleRaw(row.id)"
                    >
                      {{ rawOpen[row.id] ? "Hide raw payload" : "Show raw payload" }}
                    </button>
                    <pre
                      v-if="row.payload && rawOpen[row.id]"
                      class="max-h-56 overflow-auto rounded border border-zinc-800 bg-black/40 p-2 text-[10px] text-zinc-500"
                      >{{ JSON.stringify(row.payload, null, 2) }}</pre
                    >
                  </div>
                </div>
              </li>
            </ol>
          </section>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  subscribeRecentLogs,
  clearDebugLogs,
  formatChangeValue,
  diffFields,
  type DebugLogEntry,
  type FieldChange,
  type LogEventType,
  type LogGame,
  type LogLevel,
} from "~/utils/firebase-logger";
import { isFirebaseConfigured } from "~/utils/firebase.client";

const UNLOCK_KEY = "qydah:log-unlocked";
/** Board with an event in the last 3 minutes counts as running. */
const LIVE_WINDOW_MS = 3 * 60 * 1000;
const LOG_LIMIT = 400;

type LogRow = DebugLogEntry & { id: string };

type GameGroup = {
  key: string;
  tableId?: string;
  theme?: string;
  orientation?: string;
  game?: LogGame;
  appEnv?: string;
  latestT: number;
  isLive: boolean;
  scoreLabel: string | null;
  events: LogRow[];
};

const config = useRuntimeConfig().public;
const appEnv = computed(() => String(config.appEnv ?? "development"));
const expectedPassword = computed(() => String(config.logPassword ?? ""));

const password = ref("");
const authError = ref("");
const unlocked = ref(false);
const loading = ref(false);
const clearing = ref(false);
const loadError = ref("");
const liveOk = ref(false);
const rows = ref<LogRow[]>([]);
/** Ticks so "running" badges age without a new event. */
const nowMs = ref(Date.now());

const filterEnv = ref("");
const filterType = ref<"" | LogEventType>("");
const filterTable = ref("");
const filterGameId = ref("");
const hubOnly = ref(false);
const liveOnly = ref(false);

const collapsed = reactive<Record<string, boolean>>({});
const rawOpen = reactive<Record<string, boolean>>({});

let stopLive: (() => void) | null = null;
let clockTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  if (
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem(UNLOCK_KEY) === "1"
  ) {
    unlocked.value = true;
    startLive();
  }
});

onBeforeUnmount(() => {
  stopLiveSub();
  stopClock();
});

const filtered = computed(() => {
  const tableQ = filterTable.value.trim().toLowerCase();
  const gameQ = filterGameId.value.trim().toLowerCase();
  return rows.value.filter((row) => {
    if (filterEnv.value && row.appEnv !== filterEnv.value) return false;
    if (filterType.value && row.type !== filterType.value) return false;
    if (tableQ && !(row.tableId ?? "").toLowerCase().includes(tableQ)) {
      return false;
    }
    const gid = groupKey(row).toLowerCase();
    if (gameQ && !gid.includes(gameQ)) return false;
    if (hubOnly.value && hubNames(row).length === 0) return false;
    return true;
  });
});

const groups = computed((): GameGroup[] => {
  const map = new Map<string, GameGroup>();
  const now = nowMs.value;
  // filtered is newest-first; build chronological within each group
  for (const row of [...filtered.value].reverse()) {
    const key = groupKey(row);
    let g = map.get(key);
    if (!g) {
      g = {
        key,
        tableId: row.tableId,
        theme: row.theme,
        orientation: row.orientation,
        game: row.game,
        appEnv: row.appEnv,
        latestT: row.t,
        isLive: false,
        scoreLabel: null,
        events: [],
      };
      map.set(key, g);
    }
    g.events.push(row);
    if (row.t > g.latestT) g.latestT = row.t;
    if (!g.tableId && row.tableId) g.tableId = row.tableId;
    if (!g.theme && row.theme) g.theme = row.theme;
    if (!g.orientation && row.orientation) g.orientation = row.orientation;
    if (!g.game && row.game) g.game = row.game;
    if (!g.appEnv && row.appEnv) g.appEnv = row.appEnv;
  }

  for (const g of map.values()) {
    g.isLive = now - g.latestT <= LIVE_WINDOW_MS && !groupLooksEnded(g);
    // Prefer latest event that has a score label
    for (let i = g.events.length - 1; i >= 0; i--) {
      const label = scorePreviewLabel(g.events[i]!);
      if (label) {
        g.scoreLabel = label;
        break;
      }
    }
  }

  let list = [...map.values()];
  if (liveOnly.value) list = list.filter((g) => g.isLive);

  return list.sort((a, b) => {
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
    return b.latestT - a.latestT;
  });
});

const liveCount = computed(() => groups.value.filter((g) => g.isLive).length);

function groupLooksEnded(g: GameGroup): boolean {
  const last = g.events[g.events.length - 1];
  if (!last) return false;
  const names = hubNames(last);
  return names.some(
    (n) => n === "GameEnded" || n === "MatchEnded" || n === "GameFinished",
  );
}

function groupKey(row: LogRow): string {
  return row.gameId || row.tableId || row.tourId || "unknown";
}

function shortId(id: string) {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function hubNames(row: LogRow): string[] {
  if (row.hubEvents?.length) return row.hubEvents;
  const ev = row.payload?.events;
  if (Array.isArray(ev)) return ev.filter((e) => typeof e === "string") as string[];
  return [];
}

function rowChanges(row: LogRow): FieldChange[] {
  if (row.changes?.length) return row.changes;
  const p = row.payload;
  if (!p) return [];
  const before = p.gameBefore;
  const after = p.wsGame ?? p.gameAfter ?? p.newGame;
  if (before === undefined && after === undefined) return [];
  return diffFields(before, after);
}

function machineLabel(row: LogRow): string | null {
  const m = row.payload?.machineState;
  if (Array.isArray(m)) return m.join(" · ");
  if (typeof m === "string") return m;
  if (m && typeof m === "object") {
    try {
      return JSON.stringify(m);
    } catch {
      return null;
    }
  }
  return null;
}

function scorePreview(row: LogRow): Record<string, unknown> | null {
  const p = row.payload?.scorePreview;
  if (p && typeof p === "object") return p as Record<string, unknown>;
  return null;
}

function scorePreviewLabel(row: LogRow): string | null {
  const p = scorePreview(row);
  if (!p) return null;

  const teams = p.teams as
    | Array<{ name?: string; score?: number; hasZat?: boolean }>
    | undefined;
  if (Array.isArray(teams) && teams.length > 0) {
    const line = teams
      .map((t) => `${t.name ?? "?"} ${t.score ?? 0}${t.hasZat ? "★" : ""}`)
      .join(" · ");
    const rounds =
      typeof p.roundCount === "number" ? ` · rounds ${p.roundCount}` : "";
    return `${line}${rounds}`;
  }

  if (p.usName != null || p.usGameScore != null) {
    const sakka = p.lastSakka as
      | { usSakkaScore?: number; themSakkaScore?: number }
      | null
      | undefined;
    const sakkaPart = sakka
      ? ` · sakka ${sakka.usSakkaScore ?? "?"}/${sakka.themSakkaScore ?? "?"}`
      : "";
    return `${p.usName ?? "?"} ${p.usGameScore ?? "?"} – ${p.themGameScore ?? "?"} ${p.themName ?? "?"}${sakkaPart}`;
  }

  return null;
}

function toggleGroup(key: string) {
  collapsed[key] = !collapsed[key];
}

function toggleRaw(id: string) {
  rawOpen[id] = !rawOpen[id];
}

function expandAll() {
  for (const g of groups.value) collapsed[g.key] = false;
}

function collapseAll() {
  for (const g of groups.value) collapsed[g.key] = true;
}

function unlock() {
  authError.value = "";
  if (!expectedPassword.value) {
    authError.value = "loginPassword is not configured in .env";
    return;
  }
  if (password.value !== expectedPassword.value) {
    authError.value = "Wrong password";
    return;
  }
  unlocked.value = true;
  sessionStorage.setItem(UNLOCK_KEY, "1");
  startLive();
}

function lock() {
  unlocked.value = false;
  password.value = "";
  sessionStorage.removeItem(UNLOCK_KEY);
  stopLiveSub();
  stopClock();
  liveOk.value = false;
}

function stopLiveSub() {
  stopLive?.();
  stopLive = null;
}

function stopClock() {
  if (clockTimer) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
}

function startClock() {
  stopClock();
  nowMs.value = Date.now();
  clockTimer = setInterval(() => {
    nowMs.value = Date.now();
  }, 15_000);
}

function startLive() {
  stopLiveSub();
  startClock();
  loading.value = true;
  loadError.value = "";
  liveOk.value = false;

  if (!isFirebaseConfigured()) {
    loadError.value =
      "Firebase is not configured (apiKey / projectId / appId / databaseURL).";
    rows.value = [];
    loading.value = false;
    return;
  }

  stopLive = subscribeRecentLogs(
    LOG_LIMIT,
    (next) => {
      rows.value = next;
      loading.value = false;
      liveOk.value = true;
      loadError.value = "";
      // Auto-expand newly live games the first time we see them
      for (const g of groups.value) {
        if (g.isLive && collapsed[g.key] === undefined) {
          collapsed[g.key] = false;
        }
      }
    },
    (message) => {
      loading.value = false;
      liveOk.value = false;
      loadError.value = message;
    },
  );
}

function reconnectLive() {
  startLive();
}

async function clearLogs() {
  if (
    !confirm(
      "Clear ALL debug logs in Firebase? This cannot be undone.",
    )
  ) {
    return;
  }
  clearing.value = true;
  loadError.value = "";
  try {
    if (!isFirebaseConfigured()) {
      loadError.value = "Firebase is not configured.";
      return;
    }
    await clearDebugLogs();
    rows.value = [];
  } catch (e) {
    loadError.value =
      e instanceof Error ? e.message : "Failed to clear logs";
  } finally {
    clearing.value = false;
  }
}

async function copyJson() {
  try {
    await navigator.clipboard.writeText(
      JSON.stringify(filtered.value, null, 2),
    );
  } catch {
    /* ignore */
  }
}

function formatTime(t: number) {
  try {
    return new Date(t).toISOString().replace("T", " ").slice(0, 19);
  } catch {
    return String(t);
  }
}

function relativeAgo(t: number) {
  const sec = Math.max(0, Math.floor((nowMs.value - t) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  return `${Math.floor(min / 60)}h ago`;
}

function envBadge(env: string | undefined) {
  if (env === "production") return "bg-rose-950 text-rose-300 border border-rose-800/60";
  if (env === "staging") return "bg-amber-950 text-amber-200 border border-amber-800/60";
  if (env === "preview") return "bg-sky-950 text-sky-300 border border-sky-800/60";
  if (env === "development") return "bg-zinc-800 text-zinc-300 border border-zinc-700";
  return "bg-zinc-900 text-zinc-500 border border-zinc-800";
}

function levelBadge(level: LogLevel | undefined) {
  if (level === "error") return "bg-red-950 text-red-300";
  if (level === "warn") return "bg-amber-950 text-amber-200";
  return "bg-emerald-950/80 text-emerald-300";
}

function typeBadge(type: LogEventType | string) {
  if (type === "score") return "bg-sky-950 text-sky-300";
  if (type === "error") return "bg-red-950 text-red-300";
  if (type === "names") return "bg-fuchsia-950 text-fuchsia-300";
  if (type === "connect" || type === "reconnect" || type === "join") {
    return "bg-lime-950 text-lime-300";
  }
  return "bg-zinc-800 text-zinc-300";
}
</script>
