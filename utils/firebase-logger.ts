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

export type FieldChange = {
  field: string;
  from: unknown;
  to: unknown;
};

export type DebugLogEntry = {
  t: number;
  appEnv: string;
  level: LogLevel;
  type: LogEventType;
  message: string;
  game: LogGame;
  /** Stable id for grouping (hub game.id or table id). */
  gameId?: string;
  /** Monotonic sequence per gameId in this browser session. */
  eventSeq?: number;
  /** Hub event names from SignalR (e.g. ScoreIncreased). */
  hubEvents?: string[];
  /** Human-readable field diffs (before → after). */
  changes?: FieldChange[];
  tableId?: string;
  tourId?: string;
  theme?: string;
  orientation?: string;
  route?: string;
  payload?: Record<string, unknown>;
};

const RTDB_PATH = "debug_logs";
/** Lean logs: event names + diffs only; keep payload small in staging & production. */
const MAX_PAYLOAD_CHARS = 2500;

/** Per-tab sequence so /log can number events within a game. */
const eventSeqByGameId = new Map<string, number>();

export function nextEventSeq(gameId: string): number {
  const key = gameId || "unknown";
  const n = (eventSeqByGameId.get(key) ?? 0) + 1;
  eventSeqByGameId.set(key, n);
  return n;
}

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

function flattenForDiff(
  value: unknown,
  prefix = "",
  out: Record<string, unknown> = {},
): Record<string, unknown> {
  if (value === null || value === undefined) {
    if (prefix) out[prefix] = value;
    return out;
  }
  if (typeof value !== "object") {
    out[prefix] = value;
    return out;
  }
  if (Array.isArray(value)) {
    out[prefix || "[]"] = value;
    return out;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length === 0 && prefix) {
    out[prefix] = {};
    return out;
  }
  for (const key of keys) {
    const path = prefix ? `${prefix}.${key}` : key;
    const child = obj[key];
    if (
      child !== null &&
      typeof child === "object" &&
      !Array.isArray(child)
    ) {
      flattenForDiff(child, path, out);
    } else {
      out[path] = child;
    }
  }
  return out;
}

function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/** Diff two plain snapshots into field change rows for /log UI. */
export function diffFields(
  before: unknown,
  after: unknown,
): FieldChange[] {
  const a = flattenForDiff(before ?? null);
  const b = flattenForDiff(after ?? null);
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const changes: FieldChange[] = [];
  for (const field of [...keys].sort()) {
    const from = a[field];
    const to = b[field];
    if (sameValue(from, to)) continue;
    changes.push({
      field,
      from: from === undefined ? "(missing)" : from,
      to: to === undefined ? "(missing)" : to,
    });
  }
  return changes;
}

export function formatChangeValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export type PushLogInput = {
  type: LogEventType;
  level?: LogLevel;
  message: string;
  game?: LogGame;
  /** Hub game.id preferred for grouping. */
  gameId?: string;
  hubEvents?: string[];
  /** Explicit changes; otherwise computed from payload.gameBefore + payload.wsGame|gameAfter. */
  changes?: FieldChange[];
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

function resolveChanges(
  input: PushLogInput,
): FieldChange[] | undefined {
  if (input.changes && input.changes.length > 0) return input.changes;
  const p = input.payload;
  if (!p) return undefined;
  const before = p.gameBefore;
  const after = p.wsGame ?? p.gameAfter ?? p.newGame;
  if (before === undefined && after === undefined) return undefined;
  const changes = diffFields(before, after);
  return changes.length ? changes : undefined;
}

/** Drop heavy snapshot blobs after diffs are computed — keep /log readable & light. */
function leanPayload(
  payload?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!payload) return undefined;
  const keep: Record<string, unknown> = {};
  if (payload.machineState !== undefined) keep.machineState = payload.machineState;
  if (payload.hasStatics !== undefined) keep.hasStatics = payload.hasStatics;
  if (payload.allowFlow !== undefined) keep.allowFlow = payload.allowFlow;
  if (payload.parseError !== undefined) keep.parseError = payload.parseError;
  if (payload.error !== undefined) keep.error = payload.error;
  if (payload.hasData !== undefined) keep.hasData = payload.hasData;
  // Tiny score preview for glance (not full game) — baloot + hand shapes
  const after = (payload.wsGame ?? payload.gameAfter ?? payload.newGame) as
    | Record<string, unknown>
    | null
    | undefined;
  if (after && typeof after === "object") {
    const teams = Array.isArray(after.teams) ? after.teams : undefined;
    keep.scorePreview = {
      state: after.state,
      // baloot
      usGameScore: after.usGameScore,
      themGameScore: after.themGameScore,
      usName: after.usName,
      themName: after.themName,
      sakkaCount: after.sakkaCount,
      lastSakka: after.lastSakka,
      winner: after.winner,
      // hand
      teams,
      roundCount: after.roundCount,
      winnerTeamIndex: after.winnerTeamIndex,
    };
  }
  return Object.keys(keep).length ? keep : undefined;
}

/**
 * Best-effort write to Firebase RTDB. Never throws into callers.
 * Staging + production: store hubEvents + changes (+ tiny scorePreview), not full WS JSON.
 */
export async function pushLog(input: PushLogInput): Promise<void> {
  if (!import.meta.client) return;
  if (!isFirebaseConfigured()) return;

  try {
    const ready = await ensureFirebase();
    if (!ready) return;

    const ctx = collectContext();
    const gameId =
      input.gameId ||
      (typeof input.payload?.gameId === "string"
        ? input.payload.gameId
        : undefined) ||
      ctx.tableId ||
      "unknown";
    const eventSeq = nextEventSeq(gameId);
    const hubEvents =
      input.hubEvents ??
      (Array.isArray(input.payload?.events)
        ? (input.payload!.events as string[])
        : undefined);
    const changes = resolveChanges(input);

    const entry: DebugLogEntry = {
      t: Date.now(),
      appEnv: ctx.appEnv,
      level: input.level ?? "info",
      type: input.type,
      message: input.message.slice(0, 500),
      game: input.game ?? ctx.game,
      gameId,
      eventSeq,
      hubEvents,
      changes,
      tableId: ctx.tableId,
      tourId: ctx.tourId,
      theme: ctx.theme,
      orientation: ctx.orientation,
      route: ctx.route,
      payload: truncatePayload(leanPayload(input.payload)),
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
export async function fetchRecentLogs(limit = 400): Promise<
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
