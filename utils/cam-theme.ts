import type {
  LandscapeCamConfig,
  LandscapeCamSideLayout,
} from "~/config/themes/types";

export const CAM_SIDE_DEFAULTS = {
  frameWidthPx: 140,
  frameHeightPx: 195,
  frameLeftPx: 0,
  frameTopPx: 0,
  imageWidthPx: 140,
  imageHeightPx: 187,
  imageLeftPx: 0,
  imageTopPx: 5,
} as const;

export type ResolvedCamSide = {
  frameSrc: string;
  frameWidthPx: number;
  frameHeightPx: number;
  frameLeftPx: number;
  frameTopPx: number;
  imageWidthPx: number;
  imageHeightPx: number;
  imageLeftPx: number;
  imageTopPx: number;
};

/** Legacy flat cam shape from older RTDB / file configs. */
type LegacyCamConfig = {
  usFrameSrc?: string;
  themFrameSrc?: string;
  frameWidthPx?: number;
  frameHeightPx?: number;
  frameLeftPx?: number;
  frameTopPx?: number;
  imageWidthPx?: number;
  imageHeightPx?: number;
  imageLeftPx?: number;
  imageTopPx?: number;
  us?: Partial<LandscapeCamSideLayout> & { frameSrc?: string };
  them?: Partial<LandscapeCamSideLayout> & { frameSrc?: string };
};

function sideFromPartial(
  partial: Partial<LandscapeCamSideLayout> | undefined,
  frameSrcFallback: string,
  shared?: LegacyCamConfig,
): LandscapeCamSideLayout {
  return {
    frameSrc: partial?.frameSrc || frameSrcFallback,
    frameWidthPx: partial?.frameWidthPx ?? shared?.frameWidthPx,
    frameHeightPx: partial?.frameHeightPx ?? shared?.frameHeightPx,
    frameLeftPx: partial?.frameLeftPx ?? shared?.frameLeftPx,
    frameTopPx: partial?.frameTopPx ?? shared?.frameTopPx,
    imageWidthPx: partial?.imageWidthPx ?? shared?.imageWidthPx,
    imageHeightPx: partial?.imageHeightPx ?? shared?.imageHeightPx,
    imageLeftPx: partial?.imageLeftPx ?? shared?.imageLeftPx,
    imageTopPx: partial?.imageTopPx ?? shared?.imageTopPx,
  };
}

/** Normalize nested or legacy flat cam config into `{ us, them }`. */
export function normalizeCamConfig(
  raw: unknown,
  themeId: string,
): LandscapeCamConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as LegacyCamConfig;
  const folder = themeId === "newzat" ? "newzat" : "zat";
  const usFallback =
    c.us?.frameSrc || c.usFrameSrc || `/images/${folder}/usframe.svg`;
  const themFallback =
    c.them?.frameSrc || c.themFrameSrc || `/images/${folder}/themframe.svg`;

  return {
    us: sideFromPartial(c.us, usFallback, c),
    them: sideFromPartial(c.them, themFallback, c),
  };
}

export function resolveCamSide(
  side: LandscapeCamSideLayout | null | undefined,
  frameSrcFallback: string,
): ResolvedCamSide {
  return {
    frameSrc: side?.frameSrc || frameSrcFallback,
    frameWidthPx: side?.frameWidthPx ?? CAM_SIDE_DEFAULTS.frameWidthPx,
    frameHeightPx: side?.frameHeightPx ?? CAM_SIDE_DEFAULTS.frameHeightPx,
    frameLeftPx: side?.frameLeftPx ?? CAM_SIDE_DEFAULTS.frameLeftPx,
    frameTopPx: side?.frameTopPx ?? CAM_SIDE_DEFAULTS.frameTopPx,
    imageWidthPx: side?.imageWidthPx ?? CAM_SIDE_DEFAULTS.imageWidthPx,
    imageHeightPx: side?.imageHeightPx ?? CAM_SIDE_DEFAULTS.imageHeightPx,
    imageLeftPx: side?.imageLeftPx ?? CAM_SIDE_DEFAULTS.imageLeftPx,
    imageTopPx: side?.imageTopPx ?? CAM_SIDE_DEFAULTS.imageTopPx,
  };
}

export function defaultCamConfig(themeId: string): LandscapeCamConfig {
  const folder = themeId === "newzat" ? "newzat" : "zat";
  return {
    us: {
      frameSrc: `/images/${folder}/usframe.svg`,
      ...CAM_SIDE_DEFAULTS,
    },
    them: {
      frameSrc: `/images/${folder}/themframe.svg`,
      ...CAM_SIDE_DEFAULTS,
    },
  };
}
