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
        :style="sponsorStyle(scoreCfg.team1)"
      />
      <transition name="fade" mode="out-in">
        <p
          :key="usName"
          class="teamName"
          :style="nameStyle(scoreCfg.team1)"
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
          :style="nameStyle(scoreCfg.team2)"
        >
          {{ themName }}
        </p>
      </transition>
      <img
        v-if="scoreCfg.team2.sponsorSrc"
        :src="scoreCfg.team2.sponsorSrc"
        class="SponsorImage"
        :style="sponsorStyle(scoreCfg.team2)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * Shared landscape Score shell.
 * Same timing as the old Qydha score Vue: play video immediately,
 * delay text with mountDelaySec, pause when media reaches introEndSec.
 */
import gsap from "gsap";
import type {
  GameType,
  LandscapeScoreConfig,
  LandscapeTeamLayout,
} from "~/config/themes/types";
import { themeFontCss } from "~/config/themes/fonts";
import {
  pauseVideoOnly,
  playVideoFrom,
  waitForVideoMediaTime,
} from "~/utils/video-media-time";

const props = withDefaults(
  defineProps<{
    game?: GameType;
  }>(),
  { game: "baloot" },
);

const { theme } = useRouteTheme("zat");

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

function nameStyle(team: LandscapeTeamLayout) {
  const style: Record<string, string> = {
    left: `${team.nameLeftPx}px`,
    width: `${team.nameWidthPx}px`,
  };
  if (team.nameTopPx != null) style.top = `${team.nameTopPx}px`;
  if (team.nameColor) style.color = team.nameColor;
  if (team.nameFontSizePx != null) style.fontSize = `${team.nameFontSizePx}px`;
  const font = themeFontCss(team.nameFontFamily);
  if (font) style.fontFamily = `"${font}"`;
  return style;
}

function scoreStyle(team: LandscapeTeamLayout) {
  const style: Record<string, string> = {};
  if (team.scoreLeftPx != null) style.left = `${team.scoreLeftPx}px`;
  if (team.scoreRightPx != null) style.right = `${team.scoreRightPx}px`;
  if (team.scoreTopPx != null) style.top = `${team.scoreTopPx}px`;
  if (team.scoreColor) style.color = team.scoreColor;
  if (team.scoreFontSizePx != null) style.fontSize = `${team.scoreFontSizePx}px`;
  return style;
}

function sponsorStyle(team: LandscapeTeamLayout) {
  const style: Record<string, string> = {};
  if (team.sponsorLeftPx != null) style.left = `${team.sponsorLeftPx}px`;
  if (team.sponsorWidthPx != null) style.width = `${team.sponsorWidthPx}px`;
  if (team.sponsorHeightPx != null) style.height = `${team.sponsorHeightPx}px`;
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

/** Config can appear before v-if paints — wait for video + team wrappers. */
async function waitForScoreDom(tries = 40): Promise<boolean> {
  for (let i = 0; i < tries; i++) {
    await nextTick();
    if (mediaElm.value && teamEls().length >= 2) return true;
    await new Promise((r) => setTimeout(r, 16));
  }
  return !!(mediaElm.value && teamEls().length >= 2);
}

/** Seek only sticks after metadata — don't start intro clock before this. */
async function waitForVideoMetadata(
  video: HTMLVideoElement,
  timeoutMs = 10000,
): Promise<void> {
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) return;

  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      video.removeEventListener("loadedmetadata", finish);
      video.removeEventListener("canplay", finish);
      resolve();
    };
    video.addEventListener("loadedmetadata", finish);
    video.addEventListener("canplay", finish);
    window.setTimeout(finish, timeoutMs);
  });
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

function playVideo(atSec: number, playbackRate = 1) {
  const video = mediaElm.value;
  if (!video) return;
  void playVideoFrom(video, atSec, playbackRate);
}

function pauseVideo() {
  pauseVideoOnly(mediaElm.value);
}

const scoreMount = (score1: number, score2: number) => {
  const cfg = scoreCfg.value;
  const els = teamEls();
  if (!cfg || !els.length) return;
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

  // Wait until v-if="scoreCfg" has painted video + team wrappers
  const domReady = await waitForScoreDom();
  if (generation !== applyGeneration) return;
  if (!domReady || !mediaElm.value) return;

  // Seek/play need metadata; start intro clock only after this
  await waitForVideoMetadata(mediaElm.value);
  if (generation !== applyGeneration) return;

  const s1 = last_sakka.value?.usSakkaScore ?? 0;
  const s2 = last_sakka.value?.themSakkaScore ?? 0;

  if (newState === "score.intro") {
    const video = mediaElm.value;
    if (!video) return;
    await playVideoFrom(video, cfg.introStartSec, 1, {
      isCancelled: () => generation !== applyGeneration,
    });
    if (generation !== applyGeneration) return;
    scoreMount(s1, s2);
    const reached = await waitForVideoMediaTime(video, cfg.introEndSec, {
      isCancelled: () =>
        generation !== applyGeneration ||
        currentScoreState.value !== newState,
    });
    if (!reached) return;
    if (generation !== applyGeneration) return;
    if (currentScoreState.value !== newState) return;
    pauseVideo();
    sendNextOnceForState(newState);
  }

  if (newState === "score.main") {
    pauseVideo();
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

    void applyScoreState(newState);
  },
  { immediate: true },
);

/**
 * Stay on score: when last_sakka totals change (new sakka / decrease / sync),
 * refresh tweenedScores without forcing outro→detail.
 */
watch(
  () =>
    [
      last_sakka.value?.usSakkaScore ?? 0,
      last_sakka.value?.themSakkaScore ?? 0,
      scoreStateKey.value,
    ] as const,
  ([us, them, state], prev) => {
    if (state !== "score.main" && state !== "score.intro") return;
    if (
      prev &&
      prev[0] === us &&
      prev[1] === them &&
      prev[2] === state
    ) {
      return;
    }
    // Skip first run when entering a state — applyScoreState handles mount
    if (!prev || prev[2] !== state) return;

    if (state === "score.main") {
      mainScoreMount(us, them);
    } else {
      gsap.killTweensOf(tweenedScores);
      tweenedScores.team1 = us;
      tweenedScores.team2 = them;
    }
  },
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
