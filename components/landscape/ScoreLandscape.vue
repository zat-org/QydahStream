<template>
  <div v-if="scoreCfg">
    <video
      ref="mediaElm"
      class="video"
      :class="{ 'video--ready': videoReady }"
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
 * Names/scores stay hidden until the score video has data, then GSAP fades them in.
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
const videoReady = ref(false);
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

async function waitForTeamEls(tries = 10): Promise<HTMLElement[]> {
  for (let i = 0; i < tries; i++) {
    await nextTick();
    const els = teamEls();
    if (els.length >= 2) return els;
    await new Promise((r) => setTimeout(r, 16));
  }
  return teamEls();
}

const scoreStateKey = computed(() => {
  if (snapshot.value.matches("score.intro")) return "score.intro";
  if (snapshot.value.matches("score.main")) return "score.main";
  if (snapshot.value.matches("score.outro")) return "score.outro";
  return null;
});

const sendNextOnceForState = (stateKey: string) => {
  if (lastHandledSendState.value === stateKey) return;
  gameService.send({ type: "NEXT" });
  lastHandledSendState.value = stateKey;
};

/** Fade in names/scores — call only after video is ready/playing. */
const scoreMount = async (score1: number, score2: number, delaySec = 0) => {
  const cfg = scoreCfg.value;
  if (!cfg) return;
  const els = await waitForTeamEls();
  if (!els.length) return;
  mountTimeline?.kill();
  hideTeams();
  mountTimeline = gsap.timeline({ delay: Math.max(0, delaySec) });
  mountTimeline
    .fromTo(
      els,
      { opacity: 0 },
      {
        duration: cfg.mountFadeSec,
        opacity: 1,
        ease: "linear",
      },
    )
    .to(tweenedScores, {
      team1: score1,
      team2: score2,
      duration: cfg.scoreTweenSec,
    });
};

const scoreUnMount = async () => {
  const cfg = scoreCfg.value;
  if (!cfg) return;
  const els = await waitForTeamEls();
  if (!els.length) return;
  unmountTimeline?.kill();
  unmountTimeline = gsap.timeline();
  unmountTimeline.to(els, {
    duration: cfg.unmountFadeSec,
    opacity: 0,
    ease: "linear",
  });
};

const mainScoreMount = async (score1: number, score2: number) => {
  const cfg = scoreCfg.value;
  if (!cfg) return;
  const els = await waitForTeamEls();
  if (!els.length) return;
  mainTimeline?.kill();
  gsap.set(els, { opacity: 1 });
  mainTimeline = gsap.timeline();
  mainTimeline.to(tweenedScores, {
    team1: score1,
    team2: score2,
    duration: cfg.scoreTweenSec,
  });
};

async function waitForVideoData(video: HTMLVideoElement) {
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    videoReady.value = true;
    return;
  }

  await new Promise<void>((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      video.removeEventListener("loadeddata", done);
      video.removeEventListener("canplay", done);
      videoReady.value = true;
      resolve();
    };
    video.addEventListener("loadeddata", done);
    video.addEventListener("canplay", done);
    window.setTimeout(done, 8000);
  });
}

async function seekAndPlay(atSec: number, playbackRate = 1) {
  const video = mediaElm.value;
  if (!video) return;
  await waitForVideoData(video);
  video.playbackRate = playbackRate;
  try {
    if (Math.abs(video.currentTime - atSec) > 0.05) {
      video.currentTime = atSec;
    }
  } catch {
    /* ignore */
  }
  try {
    if (video.paused) {
      await video.play();
    }
  } catch (err) {
    console.warn("[ScoreLandscape] video.play() failed", err);
  }
}

async function seekPaused(atSec: number) {
  const video = mediaElm.value;
  if (!video) return;
  await waitForVideoData(video);
  video.pause();
  try {
    if (Math.abs(video.currentTime - atSec) > 0.05) {
      video.currentTime = atSec;
    }
  } catch {
    /* ignore */
  }
}

let applyGeneration = 0;
const lastAppliedVideo = ref<string | null>(null);

async function applyScoreState(newState: string, forceVideoRestart = false) {
  const cfg = scoreCfg.value;
  if (!cfg) return;

  const generation = ++applyGeneration;
  currentScoreState.value = newState;
  lastHandledSendState.value = null;

  await nextTick();
  if (generation !== applyGeneration) return;

  // Keep text + video faded out until media has frames
  hideTeams();
  videoReady.value = false;

  const s1 = last_sakka.value?.usSakkaScore ?? 0;
  const s2 = last_sakka.value?.themSakkaScore ?? 0;

  if (newState === "score.intro") {
    // Wait for video download/ready, then start text animation immediately (no extra delay)
    const introStartedAt = performance.now();
    await seekAndPlay(cfg.introStartSec, 1);
    if (generation !== applyGeneration) return;
    lastAppliedVideo.value = cfg.video;
    await scoreMount(s1, s2, 0);

    const elapsedMs = performance.now() - introStartedAt;
    const remainingMs = Math.max(0, cfg.introEndSec * 1000 - elapsedMs);
    await sleep(remainingMs);
    if (generation !== applyGeneration) return;
    if (currentScoreState.value !== newState) return;
    await seekPaused(cfg.introEndSec);
    sendNextOnceForState(newState);
  }

  if (newState === "score.main") {
    await seekPaused(cfg.introEndSec);
    if (generation !== applyGeneration) return;
    lastAppliedVideo.value = cfg.video;
    await mainScoreMount(s1, s2);
  }

  if (newState === "score.outro") {
    const video = mediaElm.value;
    if (video) {
      video.onended = () => {
        if (currentScoreState.value !== newState) return;
        sendNextOnceForState(newState);
      };
    }
    await seekAndPlay(cfg.introEndSec, cfg.outroPlaybackRate);
    if (generation !== applyGeneration) return;
    lastAppliedVideo.value = cfg.video;
    await scoreUnMount();
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

    void applyScoreState(newState, videoChanged);
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

/* Hidden until video has frames — then GSAP fades in */
.teamWrap {
  @apply text-[white] text-center absolute opacity-0;
}

.video {
  @apply relative top-0 left-0 z-[-1] opacity-0 transition-opacity duration-300;
}

.video--ready {
  @apply opacity-100;
}

.SponsorImage {
  @apply absolute w-[66px] h-[62px] -top-0.5;
}

* {
  font-family: "arefBold";
}
</style>
