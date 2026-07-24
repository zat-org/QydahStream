import type { GameType } from "~/config/themes/types";
import {
  defaultCamConfig,
  normalizeCamConfig,
  resolveCamSide,
  type ResolvedCamSide,
} from "~/utils/cam-theme";

/**
 * Cam player-border SVGs from theme config (?theme=…).
 * Each seat (top / bottom / left / right) has isolated frame + image layout.
 */
export function useCamThemeFrames(game: GameType = "baloot") {
  const { theme } = useRouteTheme("zat");
  const themeId = computed(() => theme.value);
  const { config: resolvedTheme } = useResolvedThemeConfig(themeId);

  const camCfg = computed(() => {
    const landscape = resolvedTheme.value?.landscape;
    if (!landscape) return null;
    const raw = landscape[game]?.cam ?? landscape.baloot?.cam ?? null;
    return normalizeCamConfig(raw, themeId.value);
  });

  const defaults = computed(() => defaultCamConfig(themeId.value));

  function seat(id: "top" | "bottom" | "left" | "right") {
    return computed<ResolvedCamSide>(() =>
      resolveCamSide(camCfg.value?.[id], defaults.value[id].frameSrc),
    );
  }

  return {
    themeId,
    camCfg,
    topCam: seat("top"),
    bottomCam: seat("bottom"),
    leftCam: seat("left"),
    rightCam: seat("right"),
  };
}
