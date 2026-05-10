import { shallowRef } from "vue";

export type ClientErrorCategory =
  | "chunk_load"
  | "chunk_reload_scheduled"
  | "chunk_reload_skipped_debounce"
  | "vue"
  | "js_global"
  | "promise"
  | "resource";

export type ClientErrorEntry = {
  t: number;
  category: ClientErrorCategory;
  message: string;
  stack?: string;
  route?: string;
  extra?: Record<string, unknown>;
};

export type ClientErrorRemoteSink = (
  entry: ClientErrorEntry,
) => void | Promise<void>;

const MAX = 80;
const STORAGE_KEY = "qydah:client-error-log";

export const clientErrorEntries = shallowRef<ClientErrorEntry[]>([]);

let remoteSink: ClientErrorRemoteSink | null = null;

export function setClientErrorRemoteSink(sink: ClientErrorRemoteSink | null) {
  remoteSink = sink;
}

function notifyRemote(row: ClientErrorEntry) {
  if (!remoteSink) return;
  Promise.resolve(remoteSink(row)).catch(() => {
    /* avoid recursive errors */
  });
}

function loadFromStorage(): ClientErrorEntry[] {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ClientErrorEntry[]) : [];
  } catch {
    return [];
  }
}

function persist(entries: ClientErrorEntry[]) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX)));
  } catch {
    /* quota / private mode */
  }
}

function normalizeMessage(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === "string") return reason;
  try {
    return JSON.stringify(reason);
  } catch {
    return String(reason);
  }
}

function normalizeStack(reason: unknown): string | undefined {
  if (reason instanceof Error && reason.stack) return reason.stack;
  return undefined;
}

export function pushClientError(entry: Omit<ClientErrorEntry, "t"> & { t?: number }) {
  const row: ClientErrorEntry = {
    t: entry.t ?? Date.now(),
    category: entry.category,
    message: entry.message,
    stack: entry.stack,
    route: entry.route,
    extra: entry.extra,
  };
  const next = [...clientErrorEntries.value, row].slice(-MAX);
  clientErrorEntries.value = next;
  persist(next);
  notifyRemote(row);

  const tag = `[QydahError:${row.category}]`;
  if (import.meta.dev) {
    console.warn(tag, row.message, row.extra ?? "", row.stack ?? "");
  } else {
    console.warn(tag, row.message, row.extra ?? "");
  }
}

export function pushClientErrorFromUnknown(
  category: ClientErrorCategory,
  reason: unknown,
  extra?: Record<string, unknown>,
) {
  pushClientError({
    category,
    message: normalizeMessage(reason),
    stack: normalizeStack(reason),
    extra,
  });
}

export function clearClientErrors() {
  clientErrorEntries.value = [];
  persist([]);
}

export function exportClientErrorsJson(): string {
  return JSON.stringify(clientErrorEntries.value, null, 2);
}

export function initClientErrorLogFromStorage() {
  clientErrorEntries.value = loadFromStorage();
}
