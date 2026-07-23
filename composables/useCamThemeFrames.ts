import type { GameType } from "~/config/themes/types";
import {
  defaultCamConfig,
  normalizeCamConfig,
  resolveCamSide,
  type ResolvedCamSide,
} from "~/utils/cam-theme";

/**
 * Cam player-border SVGs from theme config (?theme=…) with file fallbacks.
 * Us / them each have independent frame + image layout.
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

  const us = computed<ResolvedCamSide>(() =>
    resolveCamSide(
      camCfg.value?.us,
      defaults.value.us.frameSrc,
    ),
  );

  const them = computed<ResolvedCamSide>(() =>
    resolveCamSide(
      camCfg.value?.them,
      defaults.value.them.frameSrc,
    ),
  );

  return {
    themeId,
    camCfg,
    us,
    them,
  };
}
