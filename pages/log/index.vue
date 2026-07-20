<template>
  <div class="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100">
    <div class="mx-auto max-w-5xl">
      <header class="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-xl font-semibold tracking-tight">Debug logs</h1>
          <p class="mt-1 text-xs text-zinc-400">
            Firebase RTDB · appEnv filter · password required
          </p>
        </div>
        <p class="font-mono text-[11px] text-zinc-500">
          this build: {{ appEnv }}
        </p>
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
            v-model="filterTable"
            type="search"
            placeholder="table id…"
            class="min-w-[12rem] flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs"
          />
          <button
            type="button"
            class="rounded bg-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-600"
            :disabled="loading"
            @click="reload"
          >
            {{ loading ? "Loading…" : "Refresh" }}
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
        <p class="mb-2 text-xs text-zinc-500">
          showing {{ filtered.length }} / {{ rows.length }}
        </p>

        <div
          class="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50"
        >
          <div
            v-if="filtered.length === 0"
            class="px-4 py-8 text-center text-sm text-zinc-500"
          >
            No logs yet. Open a board page so events are written to Firebase.
          </div>
          <ul v-else class="divide-y divide-zinc-800 font-mono text-[11px]">
            <li
              v-for="row in filtered"
              :key="row.id"
              class="px-3 py-2.5 hover:bg-zinc-900"
            >
              <div class="flex flex-wrap gap-x-3 gap-y-1">
                <span class="text-zinc-500">{{ formatTime(row.t) }}</span>
                <span :class="levelClass(row.level)">{{ row.level }}</span>
                <span class="text-cyan-300">{{ row.type }}</span>
                <span class="text-amber-200/90">{{ row.appEnv }}</span>
                <span class="text-zinc-400">{{ row.game }}</span>
                <span v-if="row.theme" class="text-zinc-500">
                  {{ row.theme }}/{{ row.orientation ?? "?" }}
                </span>
                <span v-if="row.tableId" class="text-zinc-500">
                  table={{ row.tableId }}
                </span>
              </div>
              <div class="mt-0.5 break-words text-zinc-200">{{ row.message }}</div>
              <div v-if="row.route" class="text-zinc-600">{{ row.route }}</div>
              <div
                v-if="row.payload"
                class="mt-0.5 break-all text-zinc-600"
              >
                {{ JSON.stringify(row.payload) }}
              </div>
            </li>
          </ul>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  fetchRecentLogs,
  type DebugLogEntry,
  type LogEventType,
  type LogLevel,
} from "~/utils/firebase-logger";
import { isFirebaseConfigured } from "~/utils/firebase.client";

const UNLOCK_KEY = "qydah:log-unlocked";

const config = useRuntimeConfig().public;
const appEnv = computed(() => String(config.appEnv ?? "development"));
const expectedPassword = computed(() => String(config.logPassword ?? ""));

const password = ref("");
const authError = ref("");
const unlocked = ref(false);
const loading = ref(false);
const loadError = ref("");
const rows = ref<Array<DebugLogEntry & { id: string }>>([]);

const filterEnv = ref("");
const filterType = ref<"" | LogEventType>("");
const filterTable = ref("");

onMounted(() => {
  if (
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem(UNLOCK_KEY) === "1"
  ) {
    unlocked.value = true;
    void reload();
  }
});

const filtered = computed(() => {
  const tableQ = filterTable.value.trim().toLowerCase();
  return rows.value.filter((row) => {
    if (filterEnv.value && row.appEnv !== filterEnv.value) return false;
    if (filterType.value && row.type !== filterType.value) return false;
    if (tableQ && !(row.tableId ?? "").toLowerCase().includes(tableQ)) {
      return false;
    }
    return true;
  });
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
  void reload();
}

function lock() {
  unlocked.value = false;
  password.value = "";
  sessionStorage.removeItem(UNLOCK_KEY);
}

async function reload() {
  loading.value = true;
  loadError.value = "";
  try {
    if (!isFirebaseConfigured()) {
      loadError.value =
        "Firebase is not configured (apiKey / projectId / appId / databaseURL).";
      rows.value = [];
      return;
    }
    rows.value = await fetchRecentLogs(300);
  } catch (e) {
    loadError.value =
      e instanceof Error ? e.message : "Failed to load logs from Firebase";
  } finally {
    loading.value = false;
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

function levelClass(level: LogLevel | undefined) {
  if (level === "error") return "text-red-400";
  if (level === "warn") return "text-amber-300";
  return "text-emerald-300/90";
}
</script>
