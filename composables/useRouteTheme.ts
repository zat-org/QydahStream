export type ThemeId = "zat" | "qydha";
export type Orientation = "landscape" | "portrait";

/** Canonical theme-related query keys written to the URL (no typos). */
export type RouteThemeQuery = {
  theme: ThemeId;
  orientation: Orientation;
  showPlayers: "true" | "false";
};

const THEME_IDS = ["zat", "qydha"] as const satisfies readonly ThemeId[];
const ORIENTATIONS = [
  "landscape",
  "portrait",
] as const satisfies readonly Orientation[];

/** Legacy misspelling — read-only for old bookmarks; never write this. */
const LEGACY_ORIENTATION_KEY = "orienation";

const THEME_QUERY_KEYS = new Set([
  "theme",
  "orientation",
  "showPlayers",
  LEGACY_ORIENTATION_KEY,
]);

function isThemeId(value: unknown): value is ThemeId {
  return (
    typeof value === "string" && (THEME_IDS as readonly string[]).includes(value)
  );
}

function isOrientation(value: unknown): value is Orientation {
  return (
    typeof value === "string" &&
    (ORIENTATIONS as readonly string[]).includes(value)
  );
}

function parseTheme(value: unknown, fallback: ThemeId): ThemeId {
  return isThemeId(value) ? value : fallback;
}

function firstQueryValue(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

function parseOrientation(value: unknown, fallback: Orientation): Orientation {
  const raw = firstQueryValue(value);
  return isOrientation(raw) ? raw : fallback;
}

export function useRouteTheme(defaultTheme: ThemeId = "zat") {
  const route = useRoute();

  const theme = ref<ThemeId>(defaultTheme);
  const orientation = ref<Orientation>("landscape");
  const showPlayers = ref(false);

  theme.value = parseTheme(firstQueryValue(route.query.theme), defaultTheme);

  const rawOrientation =
    route.query.orientation ?? route.query[LEGACY_ORIENTATION_KEY];
  orientation.value = parseOrientation(rawOrientation, "landscape");

  if (route.query.showPlayers) {
    showPlayers.value = firstQueryValue(route.query.showPlayers) === "true";
  }

  /**
   * Canonical query for router push/replace.
   * - Writes only `orientation` (never the `orienation` typo).
   * - Preserves unrelated params (e.g. obsDebug).
   */
  function themeQuery(
    extra: Partial<Record<string, string>> = {},
  ): RouteThemeQuery & Record<string, string> {
    const preserved: Record<string, string> = {};
    for (const [key, value] of Object.entries(route.query)) {
      if (THEME_QUERY_KEYS.has(key)) continue;
      const v = firstQueryValue(value);
      if (typeof v === "string" && v.length > 0) {
        preserved[key] = v;
      }
    }

    return {
      ...preserved,
      theme: theme.value,
      orientation: orientation.value,
      showPlayers: showPlayers.value ? "true" : "false",
      ...extra,
    };
  }

  /** True when URL still has the legacy typo or duplicated orientation values. */
  function themeQueryNeedsNormalize(): boolean {
    const q = route.query;
    if (LEGACY_ORIENTATION_KEY in q) return true;
    const orient = q.orientation;
    if (Array.isArray(orient) && orient.length > 1) return true;
    return false;
  }

  return {
    theme,
    orientation,
    showPlayers,
    themeQuery,
    themeQueryNeedsNormalize,
  };
}
