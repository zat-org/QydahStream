import type { GameType, LandscapeCamConfig } from "~/config/themes/types";

const DEFAULTS = {
  frameWidthPx: 140,
  frameHeightPx: 195,
  frameLeftPx: 0,
  frameTopPx: 0,
  imageWidthPx: 140,
  imageHeightPx: 187,
  imageLeftPx: 0,
  imageTopPx: 5,
} as const;

function frameFallback(themeId: string, kind: "us" | "them"): string {
  const file = kind === "us" ? "usframe.svg" : "themframe.svg";
  if (themeId === "newzat") return `/images/newzat/${file}`;
  // qydha has no dedicated cam frames — reuse zat
  return `/images/zat/${file}`;
}

/**
 * Cam player-border SVGs from theme config (?theme=…) with file fallbacks.
 */
export function useCamThemeFrames(game: GameType = "baloot") {
  const { theme } = useRouteTheme("zat");
  const themeId = computed(() => theme.value);
  const { config: resolvedTheme } = useResolvedThemeConfig(themeId);

  const camCfg = computed<LandscapeCamConfig | null>(() => {
    const landscape = resolvedTheme.value?.landscape;
    if (!landscape) return null;
    return landscape[game]?.cam ?? landscape.baloot?.cam ?? null;
  });

  const usFrameSrc = computed(
    () => camCfg.value?.usFrameSrc || frameFallback(themeId.value, "us"),
  );
  const themFrameSrc = computed(
    () => camCfg.value?.themFrameSrc || frameFallback(themeId.value, "them"),
  );

  const frameWidthPx = computed(
    () => camCfg.value?.frameWidthPx ?? DEFAULTS.frameWidthPx,
  );
  const frameHeightPx = computed(
    () => camCfg.value?.frameHeightPx ?? DEFAULTS.frameHeightPx,
  );
  const frameLeftPx = computed(
    () => camCfg.value?.frameLeftPx ?? DEFAULTS.frameLeftPx,
  );
  const frameTopPx = computed(
    () => camCfg.value?.frameTopPx ?? DEFAULTS.frameTopPx,
  );

  const imageWidthPx = computed(
    () =>
      camCfg.value?.imageWidthPx ??
      camCfg.value?.frameWidthPx ??
      DEFAULTS.imageWidthPx,
  );
  const imageHeightPx = computed(
    () => camCfg.value?.imageHeightPx ?? DEFAULTS.imageHeightPx,
  );
  const imageLeftPx = computed(
    () => camCfg.value?.imageLeftPx ?? DEFAULTS.imageLeftPx,
  );
  const imageTopPx = computed(
    () => camCfg.value?.imageTopPx ?? DEFAULTS.imageTopPx,
  );

  return {
    themeId,
    camCfg,
    usFrameSrc,
    themFrameSrc,
    frameWidthPx,
    frameHeightPx,
    frameLeftPx,
    frameTopPx,
    imageWidthPx,
    imageHeightPx,
    imageLeftPx,
    imageTopPx,
  };
}
