import { push, ref as dbRef } from "firebase/database";
import { ensureFirebase, isFirebaseConfigured } from "~/utils/firebase.client";

export type LogLevel = "info" | "warn" | "error";

export type LogEventType =
  | "connect"
  | "reconnect"
  | "disconnect"
  | "join"
  | "score"
  | "names"
  | "game_event"
  | "error"
  | "route";

export type LogGame = "baloot" | "hand" | "unknown";

export type DebugLogEntry = {
  t: number;
  appEnv: string;
  level: LogLevel;
  type: LogEventType;
  message: string;
  game: LogGame;
  tableId?: string;
  tourId?: string;
  theme?: string;
  orientation?: string;
  route?: string;
  payload?: Record<string, unknown>;
};

const RTDB_PATH = "debug_logs";
/** Allow larger WS game payloads in /log (was 2000 — truncated too aggressively). */
const MAX_PAYLOAD_CHARS = 12000;

function firstQueryValue(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

function truncatePayload(
  payload?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!payload) return undefined;
  try {
    const raw = JSON.stringify(payload);
    if (raw.length <= MAX_PAYLOAD_CHARS) return payload;
    return { truncated: true, preview: raw.slice(0, MAX_PAYLOAD_CHARS) };
  } catch {
    return { truncated: true, error: "payload_serialize_failed" };
  }
}

function inferGame(path: string): LogGame {
  if (path.includes("/hand")) return "hand";
  if (path.includes("/baloot") || path.includes("/tournament")) return "baloot";
  return "unknown";
}

function collectContext(): Pick<
  DebugLogEntry,
  "appEnv" | "game" | "tableId" | "tourId" | "theme" | "orientation" | "route"
> {
  const config = useRuntimeConfig().public;
  const appEnv = String(config.appEnv ?? "development");

  if (!import.meta.client) {
    return { appEnv, game: "unknown" };
  }

  try {
    const router = useRouter();
    const route = router.currentRoute.value;
    const path = route.fullPath ?? window.location.pathname;
    const tableId =
      firstQueryValue(route.params.id) ??
      firstQueryValue(route.params.table_id);
    const tourId = firstQueryValue(route.params.tour_id);
    const theme = firstQueryValue(route.query.theme);
    const orientation =
      firstQueryValue(route.query.orientation) ??
      firstQueryValue(route.query.orienation);

    return {
      appEnv,
      game: inferGame(path),
      tableId,
      tourId,
      theme,
      orientation,
      route: path,
    };
  } catch {
    return {
      appEnv,
      game: "unknown",
      route: typeof window !== "undefined" ? window.location.pathname : undefined,
    };
  }
}

export type PushLogInput = {
  type: LogEventType;
  level?: LogLevel;
  message: string;
  game?: LogGame;
  payload?: Record<string, unknown>;
};

/** Map hub event names to log types (score / names / generic game_event). */
export function logTypeForGameEvents(events: string[]): LogEventType {
  const set = new Set(events);
  if (
    set.has("ScoreIncreased") ||
    set.has("ScoreDecreased") ||
    set.has("ScoreUpdated")
  ) {
    return "score";
  }
  if (set.has("NamesChanged") && events.length === 1) {
    return "names";
  }
  return "game_event";
}

/**
 * Best-effort write to Firebase RTDB. Never throws into callers.
 */
export async function pushLog(input: PushLogInput): Promise<void> {
  if (!import.meta.client) return;
  if (!isFirebaseConfigured()) return;

  try {
    const ready = await ensureFirebase();
    if (!ready) return;

    const ctx = collectContext();
    const entry: DebugLogEntry = {
      t: Date.now(),
      appEnv: ctx.appEnv,
      level: input.level ?? "info",
      type: input.type,
      message: input.message.slice(0, 500),
      game: input.game ?? ctx.game,
      tableId: ctx.tableId,
      tourId: ctx.tourId,
      theme: ctx.theme,
      orientation: ctx.orientation,
      route: ctx.route,
      payload: truncatePayload(input.payload),
    };

    // Drop undefined fields — RTDB rejects undefined values
    const cleaned = Object.fromEntries(
      Object.entries(entry).filter(([, v]) => v !== undefined),
    );

    await push(dbRef(ready.db, RTDB_PATH), cleaned);
  } catch (err) {
    if (import.meta.dev) {
      console.warn("[firebase-logger] push failed", err);
    }
  }
}

/** Fetch recent logs for /log page (newest first). */
export async function fetchRecentLogs(limit = 200): Promise<
  Array<DebugLogEntry & { id: string }>
> {
  if (!import.meta.client) return [];
  if (!isFirebaseConfigured()) return [];

  const { get, query, limitToLast, orderByChild } = await import(
    "firebase/database"
  );

  try {
    const ready = await ensureFirebase();
    if (!ready) return [];

    const q = query(
      dbRef(ready.db, RTDB_PATH),
      orderByChild("t"),
      limitToLast(limit),
    );
    const snap = await get(q);
    if (!snap.exists()) return [];

    const rows: Array<DebugLogEntry & { id: string }> = [];
    snap.forEach((child) => {
      const val = child.val() as DebugLogEntry;
      rows.push({ id: child.key ?? "", ...val });
    });
    return rows.reverse();
  } catch (err) {
    console.warn("[firebase-logger] fetch failed", err);
    return [];
  }
}
