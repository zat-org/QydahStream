import type {
  CamSeatId,
  LandscapeCamConfig,
  LandscapeCamSideLayout,
} from "~/config/themes/types";

export const CAM_SEAT_IDS: CamSeatId[] = ["top", "bottom", "left", "right"];

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

/** Legacy shapes from older RTDB / file configs. */
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
  top?: Partial<LandscapeCamSideLayout> & { frameSrc?: string };
  bottom?: Partial<LandscapeCamSideLayout> & { frameSrc?: string };
  left?: Partial<LandscapeCamSideLayout> & { frameSrc?: string };
  right?: Partial<LandscapeCamSideLayout> & { frameSrc?: string };
};

function isUsSeat(seat: CamSeatId): boolean {
  return seat === "top" || seat === "bottom";
}

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

function seatFallbackSrc(
  seat: CamSeatId,
  c: LegacyCamConfig,
  folder: string,
): string {
  const seatPartial = c[seat];
  if (seatPartial?.frameSrc) return seatPartial.frameSrc;

  if (isUsSeat(seat)) {
    return (
      c.us?.frameSrc ||
      c.usFrameSrc ||
      `/images/${folder}/usframe.svg`
    );
  }
  return (
    c.them?.frameSrc ||
    c.themFrameSrc ||
    `/images/${folder}/themframe.svg`
  );
}

function seatPartial(
  seat: CamSeatId,
  c: LegacyCamConfig,
): Partial<LandscapeCamSideLayout> | undefined {
  if (c[seat]) return c[seat];
  if (isUsSeat(seat)) return c.us;
  return c.them;
}

/** Normalize per-seat, `{ us, them }`, or flat cam config into 4 seats. */
export function normalizeCamConfig(
  raw: unknown,
  themeId: string,
): LandscapeCamConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as LegacyCamConfig;
  const folder = themeId === "newzat" ? "newzat" : "zat";

  const out = {} as LandscapeCamConfig;
  for (const seat of CAM_SEAT_IDS) {
    out[seat] = sideFromPartial(
      seatPartial(seat, c),
      seatFallbackSrc(seat, c, folder),
      c,
    );
  }
  return out;
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

function defaultSeat(
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
    top: defaultSeat(folder, "us"),
    bottom: defaultSeat(folder, "us"),
    left: defaultSeat(folder, "them"),
    right: defaultSeat(folder, "them"),
  };
}
