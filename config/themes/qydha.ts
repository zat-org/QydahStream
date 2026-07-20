import type { ThemeConfig } from "./types";

/**
 * Harvested from components/Score/Qydha/baloot/landscape.vue
 * Store still supplies live scores/names — this file is skin only.
 */
export const qydhaTheme: ThemeConfig = {
  id: "qydha",
  landscape: {
    baloot: {
      score: {
        video: "/videos/qydha/landscape/Corner_Score.webm",
        videoWidth: 1920,
        videoHeight: 1080,
        introStartSec: 0,
        introEndSec: 4.5,
        /** Kept for /config compatibility; score text now starts as soon as video is ready (delay 0). */
        mountDelaySec: 0,
        mountFadeSec: 1.2,
        scoreTweenSec: 0.75,
        unmountFadeSec: 0.5,
        outroPlaybackRate: 2,
        team1: {
          wrapLeftPx: 970,
          wrapTopPx: 118,
          wrapWidthPx: 324,
          wrapHeightPx: 62,
          nameLeftPx: 56, // left-14
          nameWidthPx: 185,
          scoreLeftPx: 2,
        },
        team2: {
          wrapLeftPx: 621,
          wrapTopPx: 118,
          wrapWidthPx: 324,
          wrapHeightPx: 62,
          nameLeftPx: 82,
          nameWidthPx: 185,
          scoreRightPx: 2,
        },
      },
    },
  },
};
