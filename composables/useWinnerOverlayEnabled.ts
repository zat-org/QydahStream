import type { GameType } from "~/config/themes/types";

/**
 * Theme flag: landscape.{game}.winner.enabled !== false
 * (missing / undefined = show winner, same as today).
 */
export function useWinnerOverlayEnabled(game: GameType = "baloot") {
  const { theme } = useRouteTheme("zat");
  const themeId = computed(() => theme.value);
  const { config } = useResolvedThemeConfig(themeId);

  const enabled = computed(() => {
    const landscape = config.value?.landscape;
    if (!landscape) return true;
    const winner =
      landscape[game]?.winner ?? landscape.baloot?.winner ?? null;
    return winner?.enabled !== false;
  });

  return { enabled };
}
