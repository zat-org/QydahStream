import type { Component } from "vue";
import type { ThemeId, Orientation } from "~/composables/useRouteTheme";
import type { GameType, ScreenId } from "~/config/themes/types";
import { getThemeConfig } from "~/config/themes";
import ScoreLandscape from "~/components/landscape/ScoreLandscape.vue";

/**
 * Resolve a screen component.
 * Step 1: only Qydha baloot landscape score is config-driven.
 * Other combos return null here — pages keep their existing imports as fallback.
 */
export function resolveConfigDrivenScreen(opts: {
  theme: ThemeId | string;
  orientation: Orientation;
  game: GameType;
  screen: ScreenId;
}): Component | null {
  if (opts.orientation !== "landscape") return null;
  if (opts.screen !== "score") return null;

  const theme = getThemeConfig(opts.theme);
  const score = theme?.landscape?.[opts.game]?.score;
  if (!score) return null;

  return ScoreLandscape;
}

export function hasLandscapeScoreConfig(
  theme: ThemeId | string,
  game: GameType,
): boolean {
  return Boolean(getThemeConfig(theme)?.landscape?.[game]?.score);
}
