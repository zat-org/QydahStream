import type { ThemeId, Orientation } from "~/composables/useRouteTheme";
import type { ThemeFontId } from "./fonts";

export type GameType = "baloot" | "hand";
export type ScreenId = "score" | "detail" | "winner" | "statics" | "cam";

/** Optional typography for team name / score overlays. */
export type LandscapeTeamTextStyle = {
  nameColor?: string;
  nameFontSizePx?: number;
  /** Vertical offset for team name (px). */
  nameTopPx?: number;
  /** CSS @font-face family — see config/themes/fonts.ts */
  nameFontFamily?: ThemeFontId | string;
  scoreColor?: string;
  scoreFontSizePx?: number;
  /** Vertical offset for score (px). */
  scoreTopPx?: number;
};

/** One side of the landscape score bar (us = team1, them = team2). */
export type LandscapeTeamLayout = LandscapeTeamTextStyle & {
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
  /** Sponsor logo size (defaults: score 66×62). */
  sponsorWidthPx?: number;
  sponsorHeightPx?: number;
};

/** Shared video + intro/outro timing for landscape screens. */
export type LandscapeVideoTiming = {
  video: string;
  videoWidth: number;
  videoHeight: number;
  introStartSec: number;
  introEndSec: number;
  /** Delay before overlay text fades in. */
  mountDelaySec: number;
  mountFadeSec: number;
  unmountFadeSec: number;
  outroPlaybackRate: number;
};

export type LandscapeScoreConfig = LandscapeVideoTiming & {
  scoreTweenSec: number;
  team1: LandscapeTeamLayout;
  team2: LandscapeTeamLayout;
};

/** Detail board — total score + per-moshtara abnat list. */
export type LandscapeDetailTeamLayout = LandscapeTeamTextStyle & {
  wrapLeftPx: number;
  wrapTopPx: number;
  wrapWidthPx: number;
  wrapHeightPx: number;
  nameLeftPx: number;
  nameWidthPx: number;
  scoreLeftPx?: number;
  scoreRightPx?: number;
  /** Column of round scores under the bar. */
  detailLeftPx?: number;
  detailRightPx?: number;
  detailTopPx: number;
  detailWidthPx: number;
  /** Optional sponsor mark (Zat). */
  sponsorSrc?: string;
  sponsorLeftPx?: number;
  sponsorRightPx?: number;
  /** Sponsor logo size (defaults: detail 110×100). */
  sponsorWidthPx?: number;
  sponsorHeightPx?: number;
};

export type LandscapeDetailConfig = LandscapeVideoTiming & {
  /** Hold on main before auto TO_OUTRO (ms). */
  mainHoldMs: number;
  team1: LandscapeDetailTeamLayout;
  team2: LandscapeDetailTeamLayout;
};

export type LandscapeWinnerPlayerSlot = {
  leftPx: number;
  topPx: number;
  widthPx: number;
  heightPx: number;
  rotateDeg: number;
  imgHeightPx: number;
  fallbackSrc: string;
};

/** Cam overlay — player photo frames (SVG borders). */
export type LandscapeCamConfig = {
  /** Us seats (top/bottom) border SVG. */
  usFrameSrc: string;
  /** Them seats (left/right) border SVG. */
  themFrameSrc: string;
  frameWidthPx?: number;
  frameHeightPx?: number;
  imageHeightPx?: number;
  imageTopPx?: number;
};

export type LandscapeWinnerConfig = LandscapeVideoTiming & {
  /** Hold on main before fade-out + NEW_GAME (ms). */
  mainHoldMs: number;
  /** Full-comp fade duration on unmount. */
  unmountCompFadeSec: number;
  nameTopPx: number;
  /** Horizontal offset for winner name (px). Omit to keep centered. */
  nameLeftPx?: number;
  /** Winner team name typography. */
  nameColor?: string;
  nameFontSizePx?: number;
  /** Line / box height for winner name (px). */
  nameHeightPx?: number;
  /** CSS @font-face family — see config/themes/fonts.ts */
  nameFontFamily?: ThemeFontId | string;
  player1: LandscapeWinnerPlayerSlot;
  player2: LandscapeWinnerPlayerSlot;
  /** Optional team frames (Zat Red/Black). */
  frameUsSrc?: string;
  frameThemSrc?: string;
};

export type LandscapeScreenConfig = {
  score?: LandscapeScoreConfig;
  detail?: LandscapeDetailConfig;
  winner?: LandscapeWinnerConfig;
  cam?: LandscapeCamConfig;
  // statics filled in a later step
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
