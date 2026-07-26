import type {
  CamCornerId,
  LandscapeCamConfig,
  LandscapeCamSideLayout,
} from "~/config/themes/types";

/** Screen-corner keys — layout is tied to place on the 1920×1080 frame. */
export const CAM_CORNER_IDS: CamCornerId[] = [
  "topLeft",
  "topRight",
  "bottomLeft",
  "bottomRight",
];

/** @deprecated use CAM_CORNER_IDS */
export const CAM_SEAT_IDS = CAM_CORNER_IDS;

export const CAM_CORNER_LABELS: Record<CamCornerId, string> = {
  topLeft: "Top left",
  topRight: "Top right",
  bottomLeft: "Bottom left",
  bottomRight: "Bottom right",
};

export const CAM_SIDE_DEFAULTS = {
  wrapWidthPx: 140,
  wrapHeightPx: 195,
  wrapLeftPx: 0,
  wrapTopPx: 0,
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
  wrapWidthPx: number;
  wrapHeightPx: number;
  wrapLeftPx: number;
  wrapTopPx: number;
  frameWidthPx: number;
  frameHeightPx: number;
  frameLeftPx: number;
  frameTopPx: number;
  imageWidthPx: number;
  imageHeightPx: number;
  imageLeftPx: number;
  imageTopPx: number;
};

/** Legacy shapes from older RTDB / file configs. */
type LegacyCamConfig = {
  usFrameSrc?: string;
  themFrameSrc?: string;
  wrapWidthPx?: number;
  wrapHeightPx?: number;
  wrapLeftPx?: number;
  wrapTopPx?: number;
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
  /** Old player-seat keys */
  top?: Partial<LandscapeCamSideLayout> & { frameSrc?: string };
  bottom?: Partial<LandscapeCamSideLayout> & { frameSrc?: string };
  left?: Partial<LandscapeCamSideLayout> & { frameSrc?: string };
  right?: Partial<LandscapeCamSideLayout> & { frameSrc?: string };
  /** New corner keys */
  topLeft?: Partial<LandscapeCamSideLayout> & { frameSrc?: string };
  topRight?: Partial<LandscapeCamSideLayout> & { frameSrc?: string };
  bottomLeft?: Partial<LandscapeCamSideLayout> & { frameSrc?: string };
  bottomRight?: Partial<LandscapeCamSideLayout> & { frameSrc?: string };
};

function sideFromPartial(
  partial: Partial<LandscapeCamSideLayout> | undefined,
  frameSrcFallback: string,
  shared?: LegacyCamConfig,
): LandscapeCamSideLayout {
  return {
    frameSrc: partial?.frameSrc || frameSrcFallback,
    wrapWidthPx: partial?.wrapWidthPx ?? shared?.wrapWidthPx,
    wrapHeightPx: partial?.wrapHeightPx ?? shared?.wrapHeightPx,
    wrapLeftPx: partial?.wrapLeftPx ?? shared?.wrapLeftPx,
    wrapTopPx: partial?.wrapTopPx ?? shared?.wrapTopPx,
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

/**
 * Map old player-seat configs onto screen corners using Top.vue layout:
 * topLeft←bottom, topRight←left, bottomLeft←right, bottomRight←top
 * (preserves RTDB tuning done while previewing the Top cam screen).
 */
function legacySeatForCorner(
  corner: CamCornerId,
  c: LegacyCamConfig,
): Partial<LandscapeCamSideLayout> | undefined {
  if (c[corner]) return c[corner];
  switch (corner) {
    case "topLeft":
      return c.bottom || c.us;
    case "topRight":
      return c.left || c.them;
    case "bottomLeft":
      return c.right || c.them;
    case "bottomRight":
      return c.top || c.us;
  }
}

function cornerFallbackSrc(
  corner: CamCornerId,
  c: LegacyCamConfig,
  folder: string,
): string {
  const partial = legacySeatForCorner(corner, c);
  if (partial?.frameSrc) return partial.frameSrc;

  const usSide = corner === "topLeft" || corner === "bottomRight";
  if (usSide) {
    return (
      c.us?.frameSrc || c.usFrameSrc || `/images/${folder}/usframe.svg`
    );
  }
  return (
    c.them?.frameSrc || c.themFrameSrc || `/images/${folder}/themframe.svg`
  );
}

/** Normalize any legacy cam shape into screen-corner config. */
export function normalizeCamConfig(
  raw: unknown,
  themeId: string,
): LandscapeCamConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as LegacyCamConfig;
  const folder = themeId === "newzat" ? "newzat" : "zat";

  const out = {} as LandscapeCamConfig;
  for (const corner of CAM_CORNER_IDS) {
    out[corner] = sideFromPartial(
      legacySeatForCorner(corner, c),
      cornerFallbackSrc(corner, c, folder),
      c,
    );
  }
  return out;
}

export function resolveCamSide(
  side: LandscapeCamSideLayout | null | undefined,
  frameSrcFallback: string,
): ResolvedCamSide {
  const frameWidthPx = side?.frameWidthPx ?? CAM_SIDE_DEFAULTS.frameWidthPx;
  const frameHeightPx = side?.frameHeightPx ?? CAM_SIDE_DEFAULTS.frameHeightPx;

  return {
    frameSrc: side?.frameSrc || frameSrcFallback,
    wrapWidthPx: side?.wrapWidthPx ?? frameWidthPx,
    wrapHeightPx: side?.wrapHeightPx ?? frameHeightPx,
    wrapLeftPx: side?.wrapLeftPx ?? CAM_SIDE_DEFAULTS.wrapLeftPx,
    wrapTopPx: side?.wrapTopPx ?? CAM_SIDE_DEFAULTS.wrapTopPx,
    frameWidthPx,
    frameHeightPx,
    frameLeftPx: side?.frameLeftPx ?? CAM_SIDE_DEFAULTS.frameLeftPx,
    frameTopPx: side?.frameTopPx ?? CAM_SIDE_DEFAULTS.frameTopPx,
    imageWidthPx: side?.imageWidthPx ?? CAM_SIDE_DEFAULTS.imageWidthPx,
    imageHeightPx: side?.imageHeightPx ?? CAM_SIDE_DEFAULTS.imageHeightPx,
    imageLeftPx: side?.imageLeftPx ?? CAM_SIDE_DEFAULTS.imageLeftPx,
    imageTopPx: side?.imageTopPx ?? CAM_SIDE_DEFAULTS.imageTopPx,
  };
}

function defaultCorner(
  folder: string,
  kind: "us" | "them",
): LandscapeCamSideLayout {
  return {
    frameSrc: `/images/${folder}/${kind === "us" ? "usframe" : "themframe"}.svg`,
    ...CAM_SIDE_DEFAULTS,
  };
}

export function defaultCamConfig(themeId: string): LandscapeCamConfig {
  const folder = themeId === "newzat" ? "newzat" : "zat";
  return {
    topLeft: defaultCorner(folder, "us"),
    topRight: defaultCorner(folder, "them"),
    bottomLeft: defaultCorner(folder, "them"),
    bottomRight: defaultCorner(folder, "us"),
  };
}
