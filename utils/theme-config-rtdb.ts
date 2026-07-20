import { get, ref as dbRef, set } from "firebase/database";
import { ensureFirebase, isFirebaseConfigured } from "~/utils/firebase.client";
import { getThemeConfig, listThemeIds } from "~/config/themes";
import type { ThemeConfig } from "~/config/themes/types";

export const THEME_CONFIGS_PATH = "theme_configs";

export type ThemeConfigSource = "rtdb" | "file";

export type ResolvedThemeConfig = {
  config: ThemeConfig | null;
  source: ThemeConfigSource | null;
};

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isThemeConfigShape(value: unknown): value is ThemeConfig {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "string" && v.landscape != null && typeof v.landscape === "object";
}

/** Read one theme from RTDB (null if missing / Firebase down). */
export async function fetchThemeConfigFromRtdb(
  themeId: string,
): Promise<ThemeConfig | null> {
  if (!import.meta.client || !isFirebaseConfigured()) return null;
  try {
    const ready = await ensureFirebase();
    if (!ready) return null;
    const snap = await get(dbRef(ready.db, `${THEME_CONFIGS_PATH}/${themeId}`));
    if (!snap.exists()) return null;
    const val = snap.val();
    if (!isThemeConfigShape(val)) return null;
    return deepClone(val);
  } catch (err) {
    if (import.meta.dev) {
      console.warn("[theme-config] RTDB fetch failed", err);
    }
    return null;
  }
}

/** Write full theme config to RTDB. */
export async function saveThemeConfigToRtdb(
  config: ThemeConfig,
): Promise<void> {
  if (!import.meta.client) {
    throw new Error("saveThemeConfigToRtdb is client-only");
  }
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured");
  }
  const ready = await ensureFirebase();
  if (!ready) {
    throw new Error("Firebase auth/db not ready");
  }
  const payload = deepClone({
    ...config,
    id: config.id,
    updatedAt: Date.now(),
  });
  await set(dbRef(ready.db, `${THEME_CONFIGS_PATH}/${config.id}`), payload);
}

/**
 * RTDB first, then local file fallback.
 * Always returns a clone so callers can mutate safely.
 */
export async function resolveThemeConfig(
  themeId: string,
): Promise<ResolvedThemeConfig> {
  const fromRtdb = await fetchThemeConfigFromRtdb(themeId);
  if (fromRtdb) {
    return { config: fromRtdb, source: "rtdb" };
  }
  const fromFile = getThemeConfig(themeId);
  if (fromFile) {
    return { config: deepClone(fromFile), source: "file" };
  }
  return { config: null, source: null };
}

/** Local file snapshot (fallback / reset target). */
export function getFileThemeConfig(themeId: string): ThemeConfig | null {
  const c = getThemeConfig(themeId);
  return c ? deepClone(c) : null;
}

export function listConfigurableThemeIds(): string[] {
  return listThemeIds();
}

/** Seed RTDB from local file if RTDB doc is missing. */
export async function seedThemeConfigFromFileIfMissing(
  themeId: string,
): Promise<"seeded" | "exists" | "no_file" | "skipped"> {
  const file = getFileThemeConfig(themeId);
  if (!file) return "no_file";
  if (!isFirebaseConfigured()) return "skipped";
  const existing = await fetchThemeConfigFromRtdb(themeId);
  if (existing) return "exists";
  await saveThemeConfigToRtdb(file);
  return "seeded";
}

export function exportThemeConfigJson(config: ThemeConfig): string {
  return JSON.stringify(config, null, 2);
}
