<template>
  <div v-if="scoreCfg">
    <video
      ref="mediaElm"
      class="video"
      muted
      playsinline
      preload="auto"
      :height="scoreCfg.videoHeight"
      :width="scoreCfg.videoWidth"
      :src="scoreCfg.video"
    />

    <div
      ref="team1wrapper"
      class="teamWrap"
      :style="wrapStyle(scoreCfg.team1)"
    >
      <img
        v-if="scoreCfg.team1.sponsorSrc"
        :src="scoreCfg.team1.sponsorSrc"
        class="SponsorImage"
        :style="{ left: `${scoreCfg.team1.sponsorLeftPx ?? 0}px` }"
      />
      <transition name="fade" mode="out-in">
        <p
          :key="usName"
          class="teamName"
          :style="{
            left: `${scoreCfg.team1.nameLeftPx}px`,
            width: `${scoreCfg.team1.nameWidthPx}px`,
          }"
        >
          {{ usName }}
        </p>
      </transition>
      <p class="score" :style="scoreStyle(scoreCfg.team1)">
        {{
          gameState == "Ended" ? usGameScore : tweenedScores.team1.toFixed(0)
        }}
      </p>
    </div>

    <div
      ref="team2wrapper"
      class="teamWrap"
      :style="wrapStyle(scoreCfg.team2)"
    >
      <p class="score" :style="scoreStyle(scoreCfg.team2)">
        {{
          gameState == "Ended"
            ? themGameScore
            : tweenedScores.team2.toFixed(0)
        }}
      </p>
      <transition name="fade" mode="out-in">
        <p
          :key="themName"
          class="teamName"
          :style="{
            left: `${scoreCfg.team2.nameLeftPx}px`,
            width: `${scoreCfg.team2.nameWidthPx}px`,
          }"
        >
          {{ themName }}
        </p>
      </transition>
      <img
        v-if="scoreCfg.team2.sponsorSrc"
        :src="scoreCfg.team2.sponsorSrc"
        class="SponsorImage"
        :style="{ left: `${scoreCfg.team2.sponsorLeftPx ?? 0}px` }"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * Shared landscape Score shell.
 * Same timing as the old Qydha score Vue: play video immediately,
 * delay text with mountDelaySec, fixed introEndSec clock.
 */
import gsap from "gsap";
import type {
  GameType,
  LandscapeScoreConfig,
  LandscapeTeamLayout,
} from "~/config/themes/types";

const props = withDefaults(
  defineProps<{
    game?: GameType;
  }>(),
  { game: "baloot" },
);

const { theme } = useRouteTheme("zat");
const { sleep } = useSleep();

const store = useMyBalootGameStore();
const {
  snapshot,
  usGameScore,
  themGameScore,
  usName,
  themName,
  last_sakka,
  gameState,
} = storeToRefs(store);
const { gameService } = store;

const themeId = computed(() => theme.value);
const { config: resolvedTheme } = useResolvedThemeConfig(themeId);

const scoreCfg = computed<LandscapeScoreConfig | null>(() => {
  return resolvedTheme.value?.landscape?.[props.game]?.score ?? null;
});

const mediaElm = ref<HTMLVideoElement>();
const team1wrapper = ref<HTMLElement | null>(null);
const team2wrapper = ref<HTMLElement | null>(null);
const currentScoreState = ref<string | null>(null);
const lastHandledSendState = ref<string | null>(null);
let mountTimeline: gsap.core.Timeline | null = null;
let unmountTimeline: gsap.core.Timeline | null = null;
let mainTimeline: gsap.core.Timeline | null = null;

const tweenedScores = reactive({
  team1: 0,
  team2: 0,
});

function wrapStyle(team: LandscapeTeamLayout) {
  return {
    left: `${team.wrapLeftPx}px`,
    top: `${team.wrapTopPx}px`,
    width: `${team.wrapWidthPx}px`,
    height: `${team.wrapHeightPx}px`,
  };
}

function scoreStyle(team: LandscapeTeamLayout) {
  const style: Record<string, string> = {};
  if (team.scoreLeftPx != null) style.left = `${team.scoreLeftPx}px`;
  if (team.scoreRightPx != null) style.right = `${team.scoreRightPx}px`;
  return style;
}

function teamEls(): HTMLElement[] {
  return [team1wrapper.value, team2wrapper.value].filter(
    (el): el is HTMLElement => el != null,
  );
}

function hideTeams() {
  const els = teamEls();
  if (!els.length) return;
  gsap.killTweensOf(els);
  gsap.set(els, { opacity: 0 });
}

const scoreStateKey = computed(() => {
  if (snapshot.value.matches("score.intro")) return "score.intro";
  if (snapshot.value.matches("score.main")) return "score.main";
  if (snapshot.value.matches("score.outro")) return "score.outro";
  return null;
});

const sendNextOnceForState = (stateKey: string) => {
  if (lastHandledSendState.value === stateKey) return;
  console.log("[ScoreLandscape] NEXT from", stateKey);
  gameService.send({ type: "NEXT" });
  lastHandledSendState.value = stateKey;
};

/** readyState: 0=HAVE_NOTHING 1=METADATA 2=CURRENT_DATA 3=FUTURE_DATA 4=ENOUGH_DATA */
function videoDebugSnapshot(label: string, extra: Record<string, unknown> = {}) {
  const video = mediaElm.value;
  const snap = {
    label,
    t: Math.round(performance.now()),
    hasVideoEl: !!video,
    readyState: video?.readyState ?? null,
    networkState: video?.networkState ?? null,
    currentTime: video ? Number(video.currentTime.toFixed(3)) : null,
    paused: video?.paused ?? null,
    ended: video?.ended ?? null,
    src: video?.currentSrc || video?.getAttribute("src") || null,
    scoreStateKey: scoreStateKey.value,
    currentScoreState: currentScoreState.value,
    ...extra,
  };
  console.log("[ScoreLandscape]", snap);
  return snap;
}

/** Play video from `atSec` immediately — no ready-wait, no fade gate. */
function playVideo(atSec: number, playbackRate = 1) {
  const video = mediaElm.value;
  if (!video) {
    console.warn("[ScoreLandscape] playVideo: mediaElm is null", { atSec });
    return;
  }
  videoDebugSnapshot("playVideo:before", { wantTime: atSec, playbackRate });
  video.playbackRate = playbackRate;
  try {
    video.currentTime = atSec;
  } catch (err) {
    console.warn("[ScoreLandscape] playVideo: seek failed", err);
  }
  // Seek before metadata often does not stick — check right after
  queueMicrotask(() => {
    videoDebugSnapshot("playVideo:afterSeek", {
      wantTime: atSec,
      seekStuck: Math.abs(video.currentTime - atSec) > 0.1,
    });
  });
  void video.play().then(() => {
    videoDebugSnapshot("playVideo:playing", { wantTime: atSec });
  }).catch((err) => {
    console.warn("[ScoreLandscape] video.play() failed", err);
    videoDebugSnapshot("playVideo:playFailed", { wantTime: atSec });
  });
}

function pauseVideoAt(atSec: number) {
  const video = mediaElm.value;
  if (!video) {
    console.warn("[ScoreLandscape] pauseVideoAt: mediaElm is null", { atSec });
    return;
  }
  videoDebugSnapshot("pauseVideoAt:before", { wantTime: atSec });
  video.pause();
  try {
    video.currentTime = atSec;
  } catch (err) {
    console.warn("[ScoreLandscape] pauseVideoAt: seek failed", err);
  }
  queueMicrotask(() => {
    videoDebugSnapshot("pauseVideoAt:after", {
      wantTime: atSec,
      seekStuck: Math.abs(video.currentTime - atSec) > 0.1,
    });
  });
}

const scoreMount = (score1: number, score2: number) => {
  const cfg = scoreCfg.value;
  const els = teamEls();
  if (!cfg || !els.length) {
    console.warn("[ScoreLandscape] scoreMount skipped", {
      hasCfg: !!cfg,
      els: els.length,
    });
    return;
  }
  videoDebugSnapshot("scoreMount:start", {
    delaySec: cfg.mountDelaySec,
    score1,
    score2,
  });
  mountTimeline?.kill();
  hideTeams();
  mountTimeline = gsap.timeline({ delay: Math.max(0, cfg.mountDelaySec) });
  mountTimeline
    .fromTo(
      els,
      { opacity: 0 },
      {
        duration: cfg.mountFadeSec,
        opacity: 1,
        ease: "linear",
        onStart: () => {
          videoDebugSnapshot("scoreMount:textFadeStart", {
            note: "text fade begins after mountDelaySec",
          });
        },
      },
    )
    .to(tweenedScores, {
      team1: score1,
      team2: score2,
      duration: cfg.scoreTweenSec,
    });
};

const scoreUnMount = () => {
  const cfg = scoreCfg.value;
  const els = teamEls();
  if (!cfg || !els.length) return;
  unmountTimeline?.kill();
  unmountTimeline = gsap.timeline();
  unmountTimeline.to(els, {
    duration: cfg.unmountFadeSec,
    opacity: 0,
    ease: "linear",
  });
};

const mainScoreMount = (score1: number, score2: number) => {
  const cfg = scoreCfg.value;
  const els = teamEls();
  if (!cfg || !els.length) return;
  videoDebugSnapshot("mainScoreMount:SUDDEN_SCORES", {
    note: "opacity set to 1 immediately — if you see this, you landed on score.main",
    score1,
    score2,
  });
  mainTimeline?.kill();
  gsap.set(els, { opacity: 1 });
  mainTimeline = gsap.timeline();
  mainTimeline.to(tweenedScores, {
    team1: score1,
    team2: score2,
    duration: cfg.scoreTweenSec,
  });
};

let applyGeneration = 0;

async function applyScoreState(newState: string) {
  const cfg = scoreCfg.value;
  if (!cfg) return;

  const generation = ++applyGeneration;
  currentScoreState.value = newState;
  lastHandledSendState.value = null;

  await nextTick();
  if (generation !== applyGeneration) {
    console.log("[ScoreLandscape] apply cancelled (stale generation)", {
      newState,
      generation,
      applyGeneration,
    });
    return;
  }

  const s1 = last_sakka.value?.usSakkaScore ?? 0;
  const s2 = last_sakka.value?.themSakkaScore ?? 0;

  videoDebugSnapshot("applyScoreState", {
    newState,
    generation,
    introEndSec: cfg.introEndSec,
    mountDelaySec: cfg.mountDelaySec,
  });

  if (newState === "score.intro") {
    const introStartedAt = performance.now();
    playVideo(cfg.introStartSec, 1);
    scoreMount(s1, s2);
    await sleep(cfg.introEndSec * 1000);
    if (generation !== applyGeneration) return;
    if (currentScoreState.value !== newState) return;
    videoDebugSnapshot("intro:sleepDone", {
      elapsedMs: Math.round(performance.now() - introStartedAt),
      expectedMs: cfg.introEndSec * 1000,
      note: "about to seek hold frame + NEXT → main",
    });
    pauseVideoAt(cfg.introEndSec);
    sendNextOnceForState(newState);
  }

  if (newState === "score.main") {
    pauseVideoAt(cfg.introEndSec);
    mainScoreMount(s1, s2);
  }

  if (newState === "score.outro") {
    const video = mediaElm.value;
    if (video) {
      video.onended = () => {
        if (currentScoreState.value !== newState) return;
        sendNextOnceForState(newState);
      };
    }
    playVideo(cfg.introEndSec, cfg.outroPlaybackRate);
    scoreUnMount();
  }
}

watch(
  [scoreStateKey, scoreCfg],
  ([newState], [oldState, oldCfg]) => {
    if (!newState || !scoreCfg.value) return;

    const stateChanged = newState !== oldState;
    const cfgJustReady = !oldCfg && !!scoreCfg.value;
    const videoChanged =
      !!oldCfg &&
      !!scoreCfg.value &&
      oldCfg.video !== scoreCfg.value.video;

    if (!stateChanged && !cfgJustReady && !videoChanged) {
      return;
    }

    const sameStateAlreadyHandled =
      !stateChanged && currentScoreState.value === newState && !videoChanged;
    if (sameStateAlreadyHandled && !cfgJustReady) return;

    console.log("[ScoreLandscape] watch → apply", {
      newState,
      oldState,
      cfgJustReady,
      videoChanged,
      stateChanged,
    });
    void applyScoreState(newState);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  applyGeneration++;
  mountTimeline?.kill();
  unmountTimeline?.kill();
  mainTimeline?.kill();
  mountTimeline = null;
  unmountTimeline = null;
  mainTimeline = null;
  if (mediaElm.value) {
    mediaElm.value.onended = null;
  }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  @apply transition-opacity duration-[1s] ease-[ease];
}
.fade-enter-from,
.fade-leave-to {
  @apply opacity-0;
}

.score {
  @apply text-slate-700 absolute text-[1.9rem] w-[55px] h-[55px] flex justify-center items-center top-0;
  font-family: "CairoSemiBold";
}

.teamName {
  @apply absolute text-[1.5rem] h-[40px] flex justify-center items-center top-1.5;
}

.teamWrap {
  @apply text-[white] text-center absolute opacity-0;
}

.video {
  @apply relative top-0 left-0 z-[-1];
}

.SponsorImage {
  @apply absolute w-[66px] h-[62px] -top-0.5;
}

* {
  font-family: "arefBold";
}
</style>
