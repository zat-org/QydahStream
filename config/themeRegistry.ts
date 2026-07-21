import type { Component } from "vue";
import type { ThemeId, Orientation } from "~/composables/useRouteTheme";
import type { GameType, ScreenId } from "~/config/themes/types";
import { getThemeConfig } from "~/config/themes";
import ScoreLandscape from "~/components/landscape/ScoreLandscape.vue";
import DetailLandscape from "~/components/landscape/DetailLandscape.vue";
import WinnerLandscape from "~/components/landscape/WinnerLandscape.vue";

/**
 * Resolve a config-driven landscape screen when theme file has that screen.
 * Pages keep existing imports as fallback when this returns null.
 */
export function resolveConfigDrivenScreen(opts: {
  theme: ThemeId | string;
  orientation: Orientation;
  game: GameType;
  screen: ScreenId;
}): Component | null {
  if (opts.orientation !== "landscape") return null;

  const theme = getThemeConfig(opts.theme);
  const screens = theme?.landscape?.[opts.game];
  if (!screens) return null;

  if (opts.screen === "score" && screens.score) return ScoreLandscape;
  if (opts.screen === "detail" && screens.detail) return DetailLandscape;
  if (opts.screen === "winner" && screens.winner) return WinnerLandscape;

  return null;
}

export function hasLandscapeScoreConfig(
  theme: ThemeId | string,
  game: GameType,
): boolean {
  return Boolean(getThemeConfig(theme)?.landscape?.[game]?.score);
}
