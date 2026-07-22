/**
 * Play a video from startSec until mediaTime >= endSec, then pause on that frame.
 * Prefers requestVideoFrameCallback + seeked; falls back to wall-clock sleep.
 */

type VideoFrameMetadata = { mediaTime: number };

type VideoWithRVFC = HTMLVideoElement & {
  requestVideoFrameCallback?: (
    callback: (now: number, metadata: VideoFrameMetadata) => void,
  ) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

export type PlayUntilHandle = {
  /** Stop waiting / cancel RVFC. Promise resolves false. */
  cancel: () => void;
  /** true = reached endSec and paused; false = cancelled or failed. */
  done: Promise<boolean>;
};

function seekTo(video: HTMLVideoElement, atSec: number): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => {
      video.removeEventListener("seeked", finish);
      resolve();
    };
    video.addEventListener("seeked", finish, { once: true });
    try {
      const already =
        Number.isFinite(video.currentTime) &&
        Math.abs(video.currentTime - atSec) < 0.04 &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
      if (already) {
        video.removeEventListener("seeked", finish);
        resolve();
        return;
      }
      video.currentTime = atSec;
    } catch {
      video.removeEventListener("seeked", finish);
      resolve();
    }
    // Safety if seeked never fires
    window.setTimeout(finish, 3000);
  });
}

export function playVideoUntilMediaTime(
  video: HTMLVideoElement,
  startSec: number,
  endSec: number,
  opts?: {
    playbackRate?: number;
    isCancelled?: () => boolean;
  },
): PlayUntilHandle {
  const v = video as VideoWithRVFC;
  const rate = opts?.playbackRate ?? 1;
  let cancelled = false;
  let rvfcHandle: number | null = null;
  let settle: ((ok: boolean) => void) | null = null;

  const done = new Promise<boolean>((resolve) => {
    settle = resolve;
  });

  const finish = (ok: boolean) => {
    if (!settle) return;
    const s = settle;
    settle = null;
    if (rvfcHandle != null && typeof v.cancelVideoFrameCallback === "function") {
      try {
        v.cancelVideoFrameCallback(rvfcHandle);
      } catch {
        /* ignore */
      }
    }
    rvfcHandle = null;
    s(ok);
  };

  const cancel = () => {
    cancelled = true;
    try {
      v.pause();
    } catch {
      /* ignore */
    }
    finish(false);
  };

  const isDead = () =>
    cancelled || (opts?.isCancelled ? opts.isCancelled() : false);

  void (async () => {
    if (isDead()) {
      finish(false);
      return;
    }

    v.playbackRate = rate;
    await seekTo(v, startSec);
    if (isDead()) {
      finish(false);
      return;
    }

    try {
      await v.play();
    } catch {
      /* autoplay / load race */
    }
    if (isDead()) {
      finish(false);
      return;
    }

    const snapAndPause = () => {
      try {
        v.pause();
      } catch {
        /* ignore */
      }
      try {
        v.currentTime = endSec;
      } catch {
        /* ignore */
      }
    };

    if (typeof v.requestVideoFrameCallback === "function") {
      const onFrame = (_now: number, metadata: VideoFrameMetadata) => {
        if (isDead()) {
          finish(false);
          return;
        }
        if (metadata.mediaTime >= endSec) {
          snapAndPause();
          finish(true);
          return;
        }
        rvfcHandle = v.requestVideoFrameCallback!(onFrame);
      };
      rvfcHandle = v.requestVideoFrameCallback(onFrame);
      return;
    }

    // Fallback: wall-clock for the remaining span
    const spanSec = Math.max(0, endSec - startSec) / Math.max(0.01, rate);
    await new Promise<void>((r) => window.setTimeout(r, spanSec * 1000));
    if (isDead()) {
      finish(false);
      return;
    }
    snapAndPause();
    finish(true);
  })();

  return { cancel, done };
}
