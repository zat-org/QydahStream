export type ThemeId = "zat" | "qydha";
export type Orientation = "landscape" | "portrait";

const THEME_IDS: ThemeId[] = ["zat", "qydha"];
const ORIENTATIONS: Orientation[] = ["landscape", "portrait"];

function parseTheme(value: unknown, fallback: ThemeId): ThemeId {
  if (typeof value === "string" && THEME_IDS.includes(value as ThemeId)) {
    return value as ThemeId;
  }
  return fallback;
}

function parseOrientation(value: unknown, fallback: Orientation): Orientation {
  if (typeof value === "string" && ORIENTATIONS.includes(value as Orientation)) {
    return value as Orientation;
  }
  return fallback;
}

export function useRouteTheme(defaultTheme: ThemeId = "zat") {
  const route = useRoute();

  const theme = ref<ThemeId>(defaultTheme);
  const orientation = ref<Orientation>("landscape");
  const showPlayers = ref(false);

  theme.value = parseTheme(route.query.theme, defaultTheme);

  const rawOrientation = route.query.orientation ?? route.query.orienation;
  orientation.value = parseOrientation(rawOrientation, "landscape");

  if (route.query.showPlayers) {
    showPlayers.value = route.query.showPlayers === "true";
  }

  /** Backward-compatible query object (writes both spellings). */
  function themeQuery(extra: Record<string, string> = {}) {
    return {
      theme: theme.value,
      orienation: orientation.value,
      orientation: orientation.value,
      showPlayers: `${showPlayers.value}`,
      ...extra,
    };
  }

  return {
    theme,
    orientation,
    /** @deprecated Typo alias — same ref as orientation */
    orienation: orientation,
    showPlayers,
    themeQuery,
  };
}
