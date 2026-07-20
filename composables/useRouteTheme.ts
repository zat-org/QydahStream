export type ThemeId = "zat" | "qydha";
export type Orientation = "landscape" | "portrait";

/** Canonical theme-related query keys written to the URL (no typos). */
export type RouteThemeQuery = {
  theme: ThemeId;
  orientation: Orientation;
  showPlayers: "true" | "false";
};

/**
 * Orientations that have a full board (score) for each theme.
 * Unsupported combos are coerced to the first entry.
 */
export const SUPPORTED_ORIENTATIONS: Record<
  ThemeId,
  readonly Orientation[]
> = {
  zat: ["landscape"],
  qydha: ["landscape", "portrait"],
} as const;

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

/** If orientation is not supported for theme, return the default supported one. */
export function coerceOrientation(
  theme: ThemeId,
  orientation: Orientation,
): Orientation {
  const supported = SUPPORTED_ORIENTATIONS[theme];
  if (supported.includes(orientation)) return orientation;
  return supported[0];
}

export function isOrientationSupported(
  theme: ThemeId,
  orientation: Orientation,
): boolean {
  return SUPPORTED_ORIENTATIONS[theme].includes(orientation);
}

export function useRouteTheme(defaultTheme: ThemeId = "zat") {
  const route = useRoute();

  const theme = ref<ThemeId>(defaultTheme);
  const orientation = ref<Orientation>("landscape");
  const showPlayers = ref(false);

  theme.value = parseTheme(firstQueryValue(route.query.theme), defaultTheme);

  const requestedOrientation = parseOrientation(
    route.query.orientation ?? route.query[LEGACY_ORIENTATION_KEY],
    "landscape",
  );
  // e.g. zat + portrait → landscape (zat has no portrait board)
  orientation.value = coerceOrientation(theme.value, requestedOrientation);

  if (route.query.showPlayers) {
    showPlayers.value = firstQueryValue(route.query.showPlayers) === "true";
  }

  /**
   * Canonical query for router push/replace.
   * - Writes only `orientation` (never the `orienation` typo).
   * - Uses coerced (supported) orientation.
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

  /**
   * True when URL query should be rewritten to canonical theme/orientation.
   * Covers: legacy typo key, invalid orientation (e.g. "ladscape"), unsupported combo.
   */
  function themeQueryNeedsNormalize(): boolean {
    const q = route.query;
    if (LEGACY_ORIENTATION_KEY in q) return true;

    const orient = q.orientation;
    if (Array.isArray(orient) && orient.length > 1) return true;

    const urlThemeRaw = firstQueryValue(q.theme);
    if (typeof urlThemeRaw === "string" && urlThemeRaw.length > 0) {
      if (!isThemeId(urlThemeRaw)) return true;
      if (urlThemeRaw !== theme.value) return true;
    }

    const urlOrientRaw = firstQueryValue(
      q.orientation ?? q[LEGACY_ORIENTATION_KEY],
    );
    if (typeof urlOrientRaw === "string" && urlOrientRaw.length > 0) {
      // Typo / invalid value (e.g. "ladscape") → replace with valid orientation
      if (!isOrientation(urlOrientRaw)) return true;
      if (!isOrientationSupported(theme.value, urlOrientRaw)) return true;
      if (urlOrientRaw !== orientation.value) return true;
    }

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
