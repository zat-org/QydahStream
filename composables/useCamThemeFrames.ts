import type { GameType } from "~/config/themes/types";
import {
  defaultCamConfig,
  normalizeCamConfig,
  resolveCamSide,
  type ResolvedCamSide,
} from "~/utils/cam-theme";

/**
 * Cam frame/image layout from theme config (?theme=…).
 * Keys are screen corners — same on every Cam view; only photos rotate.
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

  function corner(
    id: "topLeft" | "topRight" | "bottomLeft" | "bottomRight",
  ) {
    return computed<ResolvedCamSide>(() =>
      resolveCamSide(camCfg.value?.[id], defaults.value[id].frameSrc),
    );
  }

  return {
    themeId,
    camCfg,
    topLeftCam: corner("topLeft"),
    topRightCam: corner("topRight"),
    bottomLeftCam: corner("bottomLeft"),
    bottomRightCam: corner("bottomRight"),
  };
}
