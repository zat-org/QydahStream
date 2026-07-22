import type {
  LandscapeDetailConfig,
  LandscapeScoreConfig,
  LandscapeWinnerConfig,
  ScreenId,
} from "~/config/themes/types";

export type TimingLaneId =
  | "videoIntro"
  | "overlayFade"
  | "scoreTween"
  | "hold"
  | "outroUnmount"
  | "compFade";

export type TimingLane = {
  id: TimingLaneId;
  label: string;
  start: number;
  end: number;
  color: string;
};

export type TimingOverlap = {
  a: TimingLaneId;
  b: TimingLaneId;
  start: number;
  end: number;
  seconds: number;
  note: string;
};

export type TimingTimelineModel = {
  lanes: TimingLane[];
  overlaps: TimingOverlap[];
  totalSec: number;
  markers: { at: number; label: string }[];
};

const HOLD_STUB_SEC = 2;
const COLORS: Record<TimingLaneId, string> = {
  videoIntro: "#059669",
  overlayFade: "#2563eb",
  scoreTween: "#d97706",
  hold: "#64748b",
  outroUnmount: "#db2777",
  compFade: "#7c3aed",
};

function n(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.max(0, v) : fallback;
}

function overlaps(a: TimingLane, b: TimingLane): TimingOverlap | null {
  const start = Math.max(a.start, b.start);
  const end = Math.min(a.end, b.end);
  if (end - start <= 0.001) return null;
  return {
    a: a.id,
    b: b.id,
    start,
    end,
    seconds: end - start,
    note: `${a.label} ∩ ${b.label}`,
  };
}

function buildOverlaps(lanes: TimingLane[]): TimingOverlap[] {
  const out: TimingOverlap[] = [];
  for (let i = 0; i < lanes.length; i++) {
    for (let j = i + 1; j < lanes.length; j++) {
      const hit = overlaps(lanes[i]!, lanes[j]!);
      if (hit) out.push(hit);
    }
  }
  return out;
}

function finalize(lanes: TimingLane[], markers: TimingTimelineModel["markers"]): TimingTimelineModel {
  const usable = lanes.filter((l) => l.end > l.start + 0.001);
  const maxEnd = usable.reduce((m, l) => Math.max(m, l.end), 0);
  return {
    lanes: usable,
    overlaps: buildOverlaps(usable),
    totalSec: Math.max(maxEnd, 1),
    markers,
  };
}

export function buildScoreTimingTimeline(
  cfg: LandscapeScoreConfig,
): TimingTimelineModel {
  const introEnd = n(cfg.introEndSec);
  const mountDelay = n(cfg.mountDelaySec);
  const mountFade = n(cfg.mountFadeSec);
  const scoreTween = n(cfg.scoreTweenSec);
  const unmountFade = n(cfg.unmountFadeSec);
  const introStart = n(cfg.introStartSec);

  const fadeEnd = mountDelay + mountFade;
  const tweenEnd = fadeEnd + scoreTween;
  const holdEnd = introEnd + HOLD_STUB_SEC;

  const lanes: TimingLane[] = [
    {
      id: "videoIntro",
      label: "Video intro",
      start: 0,
      end: introEnd,
      color: COLORS.videoIntro,
    },
    {
      id: "overlayFade",
      label: "Overlay fade-in",
      start: mountDelay,
      end: fadeEnd,
      color: COLORS.overlayFade,
    },
    {
      id: "scoreTween",
      label: "Score tween",
      start: fadeEnd,
      end: tweenEnd,
      color: COLORS.scoreTween,
    },
    {
      id: "hold",
      label: "Hold (until outro)",
      start: introEnd,
      end: holdEnd,
      color: COLORS.hold,
    },
    {
      id: "outroUnmount",
      label: "Outro unmount",
      start: holdEnd,
      end: holdEnd + unmountFade,
      color: COLORS.outroUnmount,
    },
  ];

  const markers = [
    { at: 0, label: "0" },
    { at: introEnd, label: "pause" },
  ];
  if (introStart > 0.001) {
    markers[0] = { at: 0, label: `0 (media@${fmt(introStart)})` };
  }

  return finalize(lanes, markers);
}

export function buildDetailTimingTimeline(
  cfg: LandscapeDetailConfig,
): TimingTimelineModel {
  const introEnd = n(cfg.introEndSec);
  const mountDelay = n(cfg.mountDelaySec);
  const mountFade = n(cfg.mountFadeSec);
  const holdSec = n(cfg.mainHoldMs) / 1000;
  const unmountFade = n(cfg.unmountFadeSec);
  const introStart = n(cfg.introStartSec);

  const fadeEnd = mountDelay + mountFade;
  const holdEnd = introEnd + holdSec;

  const lanes: TimingLane[] = [
    {
      id: "videoIntro",
      label: "Video intro",
      start: 0,
      end: introEnd,
      color: COLORS.videoIntro,
    },
    {
      id: "overlayFade",
      label: "Overlay fade-in",
      start: mountDelay,
      end: fadeEnd,
      color: COLORS.overlayFade,
    },
    {
      id: "hold",
      label: "Main hold",
      start: introEnd,
      end: holdEnd,
      color: COLORS.hold,
    },
    {
      id: "outroUnmount",
      label: "Outro unmount",
      start: holdEnd,
      end: holdEnd + unmountFade,
      color: COLORS.outroUnmount,
    },
  ];

  const markers = [
    { at: 0, label: "0" },
    { at: introEnd, label: "pause" },
    { at: holdEnd, label: "outro" },
  ];
  if (introStart > 0.001) {
    markers[0] = { at: 0, label: `0 (media@${fmt(introStart)})` };
  }

  return finalize(lanes, markers);
}

export function buildWinnerTimingTimeline(
  cfg: LandscapeWinnerConfig,
): TimingTimelineModel {
  const introEnd = n(cfg.introEndSec);
  const mountDelay = n(cfg.mountDelaySec);
  const mountFade = n(cfg.mountFadeSec);
  const holdSec = n(cfg.mainHoldMs) / 1000;
  const compFade = n(cfg.unmountCompFadeSec);
  const introStart = n(cfg.introStartSec);

  const fadeEnd = mountDelay + mountFade;
  const holdEnd = introEnd + holdSec;

  const lanes: TimingLane[] = [
    {
      id: "videoIntro",
      label: "Video intro",
      start: 0,
      end: introEnd,
      color: COLORS.videoIntro,
    },
    {
      id: "overlayFade",
      label: "Overlay fade-in",
      start: mountDelay,
      end: fadeEnd,
      color: COLORS.overlayFade,
    },
    {
      id: "hold",
      label: "Main hold",
      start: introEnd,
      end: Math.max(holdEnd, introEnd + 0.05),
      color: COLORS.hold,
    },
    {
      id: "compFade",
      label: "Comp fade-out",
      start: holdEnd,
      end: holdEnd + compFade,
      color: COLORS.compFade,
    },
  ];

  const markers = [
    { at: 0, label: "0" },
    { at: introEnd, label: "pause" },
    { at: holdEnd, label: "fade" },
  ];
  if (introStart > 0.001) {
    markers[0] = { at: 0, label: `0 (media@${fmt(introStart)})` };
  }

  return finalize(lanes, markers);
}

export function buildTimingTimeline(
  screen: ScreenId,
  cfg:
    | LandscapeScoreConfig
    | LandscapeDetailConfig
    | LandscapeWinnerConfig
    | null,
): TimingTimelineModel | null {
  if (!cfg) return null;
  if (screen === "score") return buildScoreTimingTimeline(cfg as LandscapeScoreConfig);
  if (screen === "detail") return buildDetailTimingTimeline(cfg as LandscapeDetailConfig);
  if (screen === "winner") return buildWinnerTimingTimeline(cfg as LandscapeWinnerConfig);
  return null;
}

export function fmt(sec: number): string {
  if (!Number.isFinite(sec)) return "0";
  const rounded = Math.round(sec * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}
