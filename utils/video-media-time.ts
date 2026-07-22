/**
 * Wait until video.currentTime reaches targetSec, then resolve.
 * Does not seek or pause — caller should pause() only (no currentTime write).
 */
export function waitForVideoMediaTime(
  video: HTMLVideoElement,
  targetSec: number,
  opts?: {
    isCancelled?: () => boolean;
  },
): Promise<boolean> {
  const isCancelled = opts?.isCancelled ?? (() => false);
  const target = Math.max(0, targetSec);

  if (isCancelled()) return Promise.resolve(false);
  if (video.currentTime >= target - 0.001) return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    let settled = false;
    let rafId = 0;
    let rvfcId: number | null = null;

    const cleanup = () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("pause", onPauseCheck);
      if (rafId) cancelAnimationFrame(rafId);
      const v = video as HTMLVideoElement & {
        cancelVideoFrameCallback?: (id: number) => void;
      };
      if (rvfcId != null && typeof v.cancelVideoFrameCallback === "function") {
        v.cancelVideoFrameCallback(rvfcId);
      }
    };

    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(ok);
    };

    const check = () => {
      if (isCancelled()) {
        finish(false);
        return;
      }
      if (video.currentTime >= target - 0.001) {
        finish(true);
      }
    };

    const onTime = () => check();
    const onEnded = () => finish(!isCancelled());
    const onPauseCheck = () => {
      // External pause mid-wait — still resolve if we already reached target
      if (video.currentTime >= target - 0.001) finish(true);
    };

    video.addEventListener("timeupdate", onTime);
    video.addEventListener("ended", onEnded);
    video.addEventListener("pause", onPauseCheck);

    const v = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (
        cb: (now: number, meta: { mediaTime: number }) => void,
      ) => number;
    };

    if (typeof v.requestVideoFrameCallback === "function") {
      const tick = (_now: number, meta: { mediaTime: number }) => {
        if (settled) return;
        if (isCancelled()) {
          finish(false);
          return;
        }
        if (meta.mediaTime >= target - 0.001 || video.currentTime >= target - 0.001) {
          finish(true);
          return;
        }
        rvfcId = v.requestVideoFrameCallback!(tick);
      };
      rvfcId = v.requestVideoFrameCallback(tick);
    } else {
      const tick = () => {
        if (settled) return;
        check();
        if (!settled) rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }

    check();
  });
}

/** Seek once to start, wait for seeked, then play. */
export async function playVideoFrom(
  video: HTMLVideoElement,
  atSec: number,
  playbackRate = 1,
  opts?: { isCancelled?: () => boolean },
): Promise<boolean> {
  const isCancelled = opts?.isCancelled ?? (() => false);
  if (isCancelled()) return false;

  video.playbackRate = playbackRate;

  const needsSeek = Math.abs(video.currentTime - atSec) > 0.05;
  if (needsSeek) {
    await new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        video.removeEventListener("seeked", finish);
        resolve();
      };
      video.addEventListener("seeked", finish);
      try {
        video.currentTime = atSec;
      } catch {
        finish();
        return;
      }
      // Already at target / seek sync
      if (Math.abs(video.currentTime - atSec) <= 0.05) finish();
      window.setTimeout(finish, 1500);
    });
  }

  if (isCancelled()) return false;

  try {
    await video.play();
  } catch {
    /* autoplay / load race */
  }
  return !isCancelled();
}

export function pauseVideoOnly(video: HTMLVideoElement | null | undefined) {
  if (!video) return;
  video.pause();
}
