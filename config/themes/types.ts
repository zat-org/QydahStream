import type { ThemeId, Orientation } from "~/composables/useRouteTheme";

export type GameType = "baloot" | "hand";
export type ScreenId = "score" | "detail" | "winner" | "statics";

/** One side of the landscape score bar (us = team1, them = team2). */
export type LandscapeTeamLayout = {
  /** Absolute left of the team wrap (px). */
  wrapLeftPx: number;
  /** Absolute top of the team wrap (px). */
  wrapTopPx: number;
  wrapWidthPx: number;
  wrapHeightPx: number;
  nameLeftPx: number;
  nameWidthPx: number;
  /** Score position — use left OR right, not both. */
  scoreLeftPx?: number;
  scoreRightPx?: number;
  /** Optional sponsor mark (Zat). */
  sponsorSrc?: string;
  sponsorLeftPx?: number;
};

export type LandscapeScoreConfig = {
  video: string;
  videoWidth: number;
  videoHeight: number;
  introStartSec: number;
  introEndSec: number;
  /** Extra delay AFTER video is ready/playing before team text fades in. */
  mountDelaySec: number;
  mountFadeSec: number;
  scoreTweenSec: number;
  unmountFadeSec: number;
  outroPlaybackRate: number;
  team1: LandscapeTeamLayout;
  team2: LandscapeTeamLayout;
};

export type LandscapeScreenConfig = {
  score?: LandscapeScoreConfig;
  // detail / winner / statics filled in later steps
};

export type ThemeConfig = {
  id: ThemeId | string;
  landscape: Partial<Record<GameType, LandscapeScreenConfig>>;
};

export type LayoutKey = {
  theme: ThemeId | string;
  orientation: Orientation;
  game: GameType;
  screen: ScreenId;
};
