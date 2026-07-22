<template>
  <div v-if="detailCfg">
    <video
      ref="mediaElm"
      class="video"
      muted
      playsinline
      preload="auto"
      :height="detailCfg.videoHeight"
      :width="detailCfg.videoWidth"
      :src="detailCfg.video"
    />

    <div
      ref="team1wrapper"
      class="teamWrap"
      :style="wrapStyle(detailCfg.team1)"
    >
      <img
        v-if="detailCfg.team1.sponsorSrc"
        :src="detailCfg.team1.sponsorSrc"
        class="teamSponsor"
        :style="sponsorStyle(detailCfg.team1)"
      />
      <p
        class="teamName"
        :style="nameStyle(detailCfg.team1)"
      >
        {{ usName }}
      </p>
      <p class="teamScore" :style="scoreStyle(detailCfg.team1)">
        {{ last_sakka?.usSakkaScore ?? 0 }}
      </p>
      <div class="teamDetailedScore" :style="detailListStyle(detailCfg.team1)">
        <p v-for="(e_m, i) in ended_moshtras" :key="`us-${i}`" class="roundScore">
          {{ e_m.usAbnat }}
        </p>
      </div>
    </div>

    <div
      ref="team2wrapper"
      class="teamWrap"
      :style="wrapStyle(detailCfg.team2)"
    >
      <p class="teamScore" :style="scoreStyle(detailCfg.team2)">
        {{ last_sakka?.themSakkaScore ?? 0 }}
      </p>
      <p
        class="teamName"
        :style="nameStyle(detailCfg.team2)"
      >
        {{ themName }}
      </p>
      <img
        v-if="detailCfg.team2.sponsorSrc"
        :src="detailCfg.team2.sponsorSrc"
        class="teamSponsor"
        :style="sponsorStyle(detailCfg.team2)"
      />
      <div class="teamDetailedScore" :style="detailListStyle(detailCfg.team2)">
        <p
          v-for="(e_m, i) in ended_moshtras"
          :key="`them-${i}`"
          class="roundScore"
        >
          {{ e_m.themAbnat }}
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * Shared landscape Detail shell.
 * Harvested timing/layout from Qydha baloot detail Vue + config skin.
 */
import gsap from "gsap";
import type {
  GameType,
  LandscapeDetailConfig,
  LandscapeDetailTeamLayout,
} from "~/config/themes/types";
import {
  playVideoUntilMediaTime,
  type PlayUntilHandle,
} from "~/utils/video-play-until";

const props = withDefaults(
  defineProps<{
    game?: GameType;
  }>(),
  { game: "baloot" },
);

const { theme } = useRouteTheme("zat");
const { sleep } = useSleep();

const store = useMyBalootGameStore();
const { snapshot, usName, themName, last_sakka, ended_moshtras } =
  storeToRefs(store);
const { gameService } = store;

const themeId = computed(() => theme.value);
const { config: resolvedTheme } = useResolvedThemeConfig(themeId);

const detailCfg = computed<LandscapeDetailConfig | null>(() => {
  return resolvedTheme.value?.landscape?.[props.game]?.detail ?? null;
});

const mediaElm = ref<HTMLVideoElement>();
const team1wrapper = ref<HTMLElement | null>(null);
const team2wrapper = ref<HTMLElement | null>(null);
const currentDetailState = ref<string | null>(null);
const lastHandledSendState = ref<string | null>(null);
let mountTimeline: gsap.core.Timeline | null = null;
let unmountTimeline: gsap.core.Timeline | null = null;
let activePlayUntil: PlayUntilHandle | null = null;

function cancelActivePlayUntil() {
  activePlayUntil?.cancel();
  activePlayUntil = null;
}

function wrapStyle(team: LandscapeDetailTeamLayout) {
  return {
    left: `${team.wrapLeftPx}px`,
    top: `${team.wrapTopPx}px`,
    width: `${team.wrapWidthPx}px`,
    height: `${team.wrapHeightPx}px`,
  };
}

function nameStyle(team: LandscapeDetailTeamLayout) {
  const style: Record<string, string> = {
    left: `${team.nameLeftPx}px`,
    width: `${team.nameWidthPx}px`,
  };
  if (team.nameColor) style.color = team.nameColor;
  if (team.nameFontSizePx != null) style.fontSize = `${team.nameFontSizePx}px`;
  return style;
}

function scoreStyle(team: LandscapeDetailTeamLayout) {
  const style: Record<string, string> = {};
  if (team.scoreLeftPx != null) style.left = `${team.scoreLeftPx}px`;
  if (team.scoreRightPx != null) style.right = `${team.scoreRightPx}px`;
  if (team.scoreColor) style.color = team.scoreColor;
  if (team.scoreFontSizePx != null) style.fontSize = `${team.scoreFontSizePx}px`;
  return style;
}

function detailListStyle(team: LandscapeDetailTeamLayout) {
  const style: Record<string, string> = {
    top: `${team.detailTopPx}px`,
    width: `${team.detailWidthPx}px`,
  };
  if (team.detailLeftPx != null) style.left = `${team.detailLeftPx}px`;
  if (team.detailRightPx != null) style.right = `${team.detailRightPx}px`;
  return style;
}

function sponsorStyle(team: LandscapeDetailTeamLayout) {
  const style: Record<string, string> = {};
  if (team.sponsorLeftPx != null) style.left = `${team.sponsorLeftPx}px`;
  if (team.sponsorRightPx != null) style.right = `${team.sponsorRightPx}px`;
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

async function waitForDetailDom(tries = 40): Promise<boolean> {
  for (let i = 0; i < tries; i++) {
    await nextTick();
    if (mediaElm.value && teamEls().length >= 2) return true;
    await new Promise((r) => setTimeout(r, 16));
  }
  return !!(mediaElm.value && teamEls().length >= 2);
}

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

const detailStateKey = computed(() => {
  if (snapshot.value.matches("detail.intro")) return "detail.intro";
  if (snapshot.value.matches("detail.main")) return "detail.main";
  if (snapshot.value.matches("detail.outro")) return "detail.outro";
  return null;
});

function sendOnce(stateKey: string, type: "NEXT" | "TO_OUTRO" | "CHECK_END") {
  if (lastHandledSendState.value === `${stateKey}:${type}`) return;
  gameService.send({ type });
  lastHandledSendState.value = `${stateKey}:${type}`;
}

function playVideo(atSec: number, playbackRate = 1) {
  const video = mediaElm.value;
  if (!video) return;
  video.playbackRate = playbackRate;
  try {
    video.currentTime = atSec;
  } catch {
    /* ignore */
  }
  void video.play().catch(() => {
    /* autoplay / load race */
  });
}

function pauseVideoAt(atSec: number) {
  const video = mediaElm.value;
  if (!video) return;
  video.pause();
  try {
    video.currentTime = atSec;
  } catch {
    /* ignore */
  }
}

const detailMount = () => {
  const cfg = detailCfg.value;
  const els = teamEls();
  if (!cfg || !els.length) return;
  mountTimeline?.kill();
  hideTeams();
  mountTimeline = gsap.timeline({ delay: Math.max(0, cfg.mountDelaySec) });
  mountTimeline.fromTo(
    els,
    { opacity: 0 },
    {
      duration: cfg.mountFadeSec,
      opacity: 1,
      ease: "linear",
    },
  );
};

const detailUnMount = () => {
  const cfg = detailCfg.value;
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

let applyGeneration = 0;

async function applyDetailState(newState: string) {
  const cfg = detailCfg.value;
  if (!cfg) return;

  const generation = ++applyGeneration;
  cancelActivePlayUntil();
  currentDetailState.value = newState;
  lastHandledSendState.value = null;

  const domReady = await waitForDetailDom();
  if (generation !== applyGeneration) return;
  if (!domReady || !mediaElm.value) return;

  await waitForVideoMetadata(mediaElm.value);
  if (generation !== applyGeneration) return;

  if (newState === "detail.intro") {
    detailMount();
    const handle = playVideoUntilMediaTime(
      mediaElm.value,
      cfg.introStartSec,
      cfg.introEndSec,
      {
        playbackRate: 1,
        isCancelled: () => generation !== applyGeneration,
      },
    );
    activePlayUntil = handle;
    const reached = await handle.done;
    if (activePlayUntil === handle) activePlayUntil = null;
    if (!reached) return;
    if (generation !== applyGeneration) return;
    if (currentDetailState.value !== newState) return;
    pauseVideoAt(cfg.introEndSec);
    sendOnce(newState, "NEXT");
  }

  if (newState === "detail.main") {
    pauseVideoAt(cfg.introEndSec);
    await sleep(cfg.mainHoldMs);
    if (generation !== applyGeneration) return;
    if (currentDetailState.value !== newState) return;
    sendOnce(newState, "TO_OUTRO");
  }

  if (newState === "detail.outro") {
    const video = mediaElm.value;
    if (video) {
      video.onended = () => {
        if (currentDetailState.value !== newState) return;
        sendOnce(newState, "CHECK_END");
      };
    }
    playVideo(cfg.introEndSec, cfg.outroPlaybackRate);
    detailUnMount();
  }
}

watch(
  [detailStateKey, detailCfg],
  ([newState], [oldState, oldCfg]) => {
    if (!newState || !detailCfg.value) return;

    const stateChanged = newState !== oldState;
    const cfgJustReady = !oldCfg && !!detailCfg.value;
    const videoChanged =
      !!oldCfg &&
      !!detailCfg.value &&
      oldCfg.video !== detailCfg.value.video;

    if (!stateChanged && !cfgJustReady && !videoChanged) return;

    const sameStateAlreadyHandled =
      !stateChanged && currentDetailState.value === newState && !videoChanged;
    if (sameStateAlreadyHandled && !cfgJustReady) return;

    void applyDetailState(newState);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  applyGeneration++;
  cancelActivePlayUntil();
  mountTimeline?.kill();
  unmountTimeline?.kill();
  mountTimeline = null;
  unmountTimeline = null;
  if (mediaElm.value) {
    mediaElm.value.onended = null;
  }
});
</script>

<style scoped>
.video {
  @apply relative top-0 left-0 z-[-1];
}

.teamWrap {
  @apply text-[white] text-center absolute opacity-0;
  font-family: "arefBold";
}

.teamName {
  @apply absolute text-[2rem] h-[81px] flex justify-center items-center top-2;
}

.teamScore {
  @apply absolute text-slate-700 text-[2.8rem] w-[100px] h-[97px] flex justify-center items-center top-0;
  font-family: "CairoSemiBold";
}

.teamDetailedScore {
  @apply text-[white] absolute text-[1.8rem];
  font-family: "CairoSemiBold";
}

.teamSponsor {
  @apply absolute w-[110px] h-[100px] top-[-5px];
}

.roundScore {
  @apply font-extrabold text-5xl leading-[3rem] m-0 p-0;
}
</style>
