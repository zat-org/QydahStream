<template>
  <div class="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100">
    <div class="mx-auto max-w-4xl">
      <header class="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-xl font-semibold tracking-tight">Theme config</h1>
          <p class="mt-1 text-xs text-zinc-400">
            Not Firestore — use
            <strong class="text-zinc-300">Realtime Database</strong>
            → path
            <code class="text-emerald-300/90">theme_configs/{{ activeThemeId || "qydha" }}</code>
            · default = local file · same password as /log
          </p>
        </div>
        <NuxtLink
          to="/log"
          class="text-xs text-emerald-400/90 underline-offset-2 hover:underline"
        >
          Open /log
        </NuxtLink>
      </header>

      <form
        v-if="!unlocked"
        class="mx-auto max-w-sm rounded-lg border border-zinc-700 bg-zinc-900 p-5"
        @submit.prevent="unlock"
      >
        <label class="block text-sm text-zinc-300" for="config-password">
          Password
        </label>
        <input
          id="config-password"
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
        <!-- Theme tabs -->
        <div class="mb-3 flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
          <button
            v-for="id in themeIds"
            :key="id"
            type="button"
            class="rounded px-3 py-1.5 text-xs font-medium"
            :class="
              activeThemeId === id
                ? 'bg-emerald-700 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            "
            @click="selectTheme(id)"
          >
            {{ id }}
          </button>
          <button
            type="button"
            class="ml-auto rounded bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-700"
            @click="lock"
          >
            Lock
          </button>
        </div>

        <!-- Screen tabs -->
        <div class="mb-4 flex flex-wrap gap-2">
          <button
            v-for="screen in screens"
            :key="screen"
            type="button"
            class="rounded px-3 py-1.5 text-xs"
            :class="
              activeScreen === screen
                ? 'bg-zinc-100 text-zinc-900'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            "
            @click="activeScreen = screen"
          >
            {{ screen }}
          </button>
          <span class="self-center text-[10px] text-zinc-500">
            game: baloot · landscape
          </span>
        </div>

        <div
          class="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 p-3 text-xs"
        >
          <span class="text-zinc-400">
            source:
            <strong class="text-zinc-200">{{ draftSource ?? "—" }}</strong>
          </span>
          <span
            class="rounded px-2 py-1 text-[10px]"
            :class="
              autoSaveLabel.includes('fail')
                ? 'bg-red-900/50 text-red-300'
                : autoSaveLabel.includes('Saving') ||
                    autoSaveLabel.includes('Pending')
                  ? 'bg-amber-900/40 text-amber-200'
                  : 'bg-zinc-800 text-zinc-400'
            "
          >
            {{ autoSaveLabel }}
          </span>
          <button
            type="button"
            class="rounded bg-zinc-700 px-3 py-1.5 hover:bg-zinc-600"
            :disabled="busy"
            @click="reloadDraft"
          >
            Reload
          </button>
          <button
            type="button"
            class="rounded bg-zinc-700 px-3 py-1.5 hover:bg-zinc-600"
            :disabled="busy"
            @click="resetToFile"
          >
            Reset to file
          </button>
          <button
            type="button"
            class="rounded bg-amber-800/90 px-3 py-1.5 hover:bg-amber-700"
            :disabled="busy || !draft"
            @click="publishFileToRtdb"
          >
            Publish file → RTDB
          </button>
          <button
            type="button"
            class="rounded bg-emerald-700 px-3 py-1.5 hover:bg-emerald-600"
            :disabled="busy || !draft"
            @click="saveNow"
          >
            Save now
          </button>
          <button
            type="button"
            class="rounded bg-zinc-700 px-3 py-1.5 hover:bg-zinc-600"
            :disabled="!draft"
            @click="copyExport"
          >
            Copy JSON
          </button>
          <button
            type="button"
            class="rounded bg-zinc-700 px-3 py-1.5 hover:bg-zinc-600"
            :disabled="!draft"
            @click="downloadExport"
          >
            Download JSON
          </button>
        </div>

        <p v-if="statusMsg" class="mb-3 text-xs text-emerald-400/90">
          {{ statusMsg }}
        </p>
        <p v-if="errorMsg" class="mb-3 text-xs text-red-400">{{ errorMsg }}</p>
        <p v-if="busy" class="mb-3 text-xs text-zinc-500">Working…</p>

        <div
          v-if="activeScreen !== 'score'"
          class="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-8 text-center text-sm text-zinc-500"
        >
          Screen “{{ activeScreen }}” is not in local config yet. Harvest it in
          a later step, then edit here.
        </div>

        <div
          v-else-if="!scoreDraft"
          class="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-8 text-center text-sm text-zinc-500"
        >
          No landscape baloot score config for theme “{{ activeThemeId }}”.
        </div>

        <form
          v-else
          class="space-y-6 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"
          @submit.prevent
        >
          <section>
            <h2 class="mb-3 text-sm font-semibold text-zinc-200">Video & timing</h2>
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="block text-xs text-zinc-400 sm:col-span-2">
                video
                <input
                  v-model="scoreDraft.video"
                  class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                />
              </label>
              <label
                v-for="field in timingFields"
                :key="field.key"
                class="block text-xs text-zinc-400"
              >
                {{ field.key }}
                <input
                  v-model.number="scoreDraft[field.key]"
                  type="number"
                  step="any"
                  class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                />
              </label>
            </div>
          </section>

          <section
            v-for="side in teamSides"
            :key="side.key"
            class="border-t border-zinc-800 pt-4"
          >
            <h2 class="mb-3 text-sm font-semibold text-zinc-200">
              {{ side.label }}
            </h2>
            <div class="grid gap-3 sm:grid-cols-3">
              <label
                v-for="field in teamFields"
                :key="field"
                class="block text-xs text-zinc-400"
              >
                {{ field }}
                <input
                  v-model.number="scoreDraft[side.key][field]"
                  type="number"
                  step="any"
                  class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                />
              </label>
              <label class="block text-xs text-zinc-400 sm:col-span-3">
                sponsorSrc (optional)
                <input
                  v-model="scoreDraft[side.key].sponsorSrc"
                  class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                />
              </label>
            </div>
          </section>
        </form>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  LandscapeScoreConfig,
  LandscapeTeamLayout,
  ScreenId,
  ThemeConfig,
} from "~/config/themes/types";
import {
  exportThemeConfigJson,
  getFileThemeConfig,
  listConfigurableThemeIds,
  resolveThemeConfig,
  saveThemeConfigToRtdb,
  seedThemeConfigFromFileIfMissing,
  type ThemeConfigSource,
} from "~/utils/theme-config-rtdb";
import { isFirebaseConfigured } from "~/utils/firebase.client";

const UNLOCK_KEY = "qydah:log-unlocked";

type TimingKey = keyof Pick<
  LandscapeScoreConfig,
  | "videoWidth"
  | "videoHeight"
  | "introStartSec"
  | "introEndSec"
  | "mountDelaySec"
  | "mountFadeSec"
  | "scoreTweenSec"
  | "unmountFadeSec"
  | "outroPlaybackRate"
>;

type TeamNumKey = keyof Pick<
  LandscapeTeamLayout,
  | "wrapLeftPx"
  | "wrapTopPx"
  | "wrapWidthPx"
  | "wrapHeightPx"
  | "nameLeftPx"
  | "nameWidthPx"
  | "scoreLeftPx"
  | "scoreRightPx"
  | "sponsorLeftPx"
>;

const config = useRuntimeConfig().public;
const expectedPassword = computed(() => String(config.logPassword ?? ""));

const password = ref("");
const authError = ref("");
const unlocked = ref(false);

const themeIds = listConfigurableThemeIds();
const activeThemeId = ref(themeIds[0] ?? "qydha");
const screens: ScreenId[] = ["score", "detail", "statics", "winner"];
const activeScreen = ref<ScreenId>("score");

const draft = ref<ThemeConfig | null>(null);
const draftSource = ref<ThemeConfigSource | null>(null);
const busy = ref(false);
const statusMsg = ref("");
const errorMsg = ref("");
const suppressAutosave = ref(true);
const autoSaveLabel = ref("Auto-save on");

const AUTOSAVE_MS = 700;
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

const timingFields: { key: TimingKey }[] = [
  { key: "videoWidth" },
  { key: "videoHeight" },
  { key: "introStartSec" },
  { key: "introEndSec" },
  { key: "mountDelaySec" },
  { key: "mountFadeSec" },
  { key: "scoreTweenSec" },
  { key: "unmountFadeSec" },
  { key: "outroPlaybackRate" },
];

const teamFields: TeamNumKey[] = [
  "wrapLeftPx",
  "wrapTopPx",
  "wrapWidthPx",
  "wrapHeightPx",
  "nameLeftPx",
  "nameWidthPx",
  "scoreLeftPx",
  "scoreRightPx",
  "sponsorLeftPx",
];

const teamSides = [
  { key: "team1" as const, label: "Team 1 (us)" },
  { key: "team2" as const, label: "Team 2 (them)" },
];

const scoreDraft = computed(
  () => draft.value?.landscape?.baloot?.score ?? null,
);

function clearAutosaveTimer() {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
}

function scheduleAutosave() {
  if (suppressAutosave.value || !unlocked.value || !draft.value) return;
  clearAutosaveTimer();
  autoSaveLabel.value = "Pending save…";
  autosaveTimer = setTimeout(() => {
    void runAutosave();
  }, AUTOSAVE_MS);
}

async function runAutosave() {
  if (!draft.value || suppressAutosave.value) return;
  autoSaveLabel.value = "Saving…";
  errorMsg.value = "";
  try {
    await saveThemeConfigToRtdb(draft.value);
    draftSource.value = "rtdb";
    autoSaveLabel.value = `Saved ${new Date().toLocaleTimeString()}`;
    statusMsg.value = `Auto-saved theme_configs/${draft.value.id} — open boards update live`;
  } catch (e) {
    autoSaveLabel.value = "Save failed";
    errorMsg.value = e instanceof Error ? e.message : "Auto-save failed";
  }
}

watch(
  draft,
  () => {
    scheduleAutosave();
  },
  { deep: true },
);

onMounted(() => {
  if (
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem(UNLOCK_KEY) === "1"
  ) {
    unlocked.value = true;
    void reloadDraft();
  }
});

onBeforeUnmount(() => {
  clearAutosaveTimer();
});

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
  void reloadDraft();
}

function lock() {
  unlocked.value = false;
  password.value = "";
  sessionStorage.removeItem(UNLOCK_KEY);
  clearAutosaveTimer();
  suppressAutosave.value = true;
}

function selectTheme(id: string) {
  activeThemeId.value = id;
  void reloadDraft();
}

async function reloadDraft() {
  busy.value = true;
  suppressAutosave.value = true;
  clearAutosaveTimer();
  errorMsg.value = "";
  statusMsg.value = "";
  try {
    if (!isFirebaseConfigured()) {
      statusMsg.value = "Firebase not configured — showing local file only";
    }
    const result = await resolveThemeConfig(activeThemeId.value);
    draft.value = result.config;
    draftSource.value = result.source;
    autoSaveLabel.value = "Auto-save on";
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : "Reload failed";
  } finally {
    busy.value = false;
    await nextTick();
    suppressAutosave.value = false;
  }
}

async function resetToFile() {
  busy.value = true;
  suppressAutosave.value = true;
  clearAutosaveTimer();
  errorMsg.value = "";
  statusMsg.value = "";
  try {
    const file = getFileThemeConfig(activeThemeId.value);
    if (!file) {
      errorMsg.value = "No local file for this theme";
      return;
    }
    draft.value = file;
    draftSource.value = "file";
    statusMsg.value = "Draft reset to local file — will auto-save shortly";
  } finally {
    busy.value = false;
    await nextTick();
    suppressAutosave.value = false;
    scheduleAutosave();
  }
}

async function saveNow() {
  clearAutosaveTimer();
  await runAutosave();
}

async function publishFileToRtdb() {
  busy.value = true;
  suppressAutosave.value = true;
  clearAutosaveTimer();
  errorMsg.value = "";
  statusMsg.value = "";
  try {
    const file = getFileThemeConfig(activeThemeId.value);
    if (!file) {
      errorMsg.value = "No local file for this theme";
      return;
    }
    const result = await seedThemeConfigFromFileIfMissing(activeThemeId.value);
    if (result === "exists") {
      await saveThemeConfigToRtdb(file);
      statusMsg.value = `Overwrote theme_configs/${file.id} from local file`;
    } else if (result === "seeded") {
      statusMsg.value = `Created theme_configs/${file.id} from local file`;
    } else if (result === "skipped") {
      errorMsg.value = "Firebase not configured";
      return;
    } else {
      errorMsg.value = "No local file to publish";
      return;
    }
    await reloadDraft();
    draftSource.value = "rtdb";
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : "Publish failed";
  } finally {
    busy.value = false;
    await nextTick();
    suppressAutosave.value = false;
  }
}

async function copyExport() {
  if (!draft.value) return;
  try {
    await navigator.clipboard.writeText(exportThemeConfigJson(draft.value));
    statusMsg.value = "JSON copied — paste into config/themes/{id}.ts if needed";
  } catch {
    errorMsg.value = "Clipboard failed";
  }
}

function downloadExport() {
  if (!draft.value) return;
  const blob = new Blob([exportThemeConfigJson(draft.value)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `theme-${draft.value.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
  statusMsg.value = "Downloaded JSON export";
}
</script>
