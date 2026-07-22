<template>
  <div
    v-if="winnerCfg"
    ref="winnerComp"
    class="winnerComp"
    :style="{
      width: `${winnerCfg.videoWidth}px`,
      height: `${winnerCfg.videoHeight}px`,
    }"
  >
    <div
      ref="winnerData"
      class="winnerData"
      :style="winnerDataStyle"
    >
      <p
        v-if="winner"
        class="winnerName"
        :class="{ winnerNameSolid: !!winnerCfg.nameColor }"
        :style="winnerNameStyle"
      >
        {{ winner.name }}
      </p>
    </div>

    <div class="playersLayer">
      <div class="playersInner">
        <div
          class="playerSlot"
          :style="playerSlotStyle(winnerCfg.player1)"
        >
          <img
            v-if="winnerFrameSrc"
            class="playerFrame"
            :src="winnerFrameSrc"
            :style="{
              width: `${winnerCfg.player1.widthPx}px`,
              height: `${winnerCfg.player1.heightPx}px`,
            }"
          />
          <img
            ref="winnerImage1"
            class="playerImg"
            :style="{ height: `${winnerCfg.player1.imgHeightPx}px` }"
            :src="playerSrc(0, winnerCfg.player1.fallbackSrc)"
          />
        </div>
        <div
          class="playerSlot"
          :style="playerSlotStyle(winnerCfg.player2)"
        >
          <img
            v-if="winnerFrameSrc"
            class="playerFrame"
            :src="winnerFrameSrc"
            :style="{
              width: `${winnerCfg.player2.widthPx}px`,
              height: `${winnerCfg.player2.heightPx}px`,
            }"
          />
          <img
            ref="winnerImage2"
            class="playerImg"
            :style="{ height: `${winnerCfg.player2.imgHeightPx}px` }"
            :src="playerSrc(1, winnerCfg.player2.fallbackSrc)"
          />
        </div>
      </div>
    </div>

    <video
      ref="mediaElm"
      class="video"
      muted
      playsinline
      preload="auto"
      :height="winnerCfg.videoHeight"
      :width="winnerCfg.videoWidth"
      :src="winnerCfg.video"
    />
  </div>
</template>

<script lang="ts" setup>
/**
 * Shared landscape Winner shell.
 * Harvested timing/layout from Qydha baloot winner Vue + config skin.
 */
import gsap from "gsap";
import type {
  GameType,
  LandscapeWinnerConfig,
  LandscapeWinnerPlayerSlot,
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
const { sleep } = useSleep();

const store = useMyBalootGameStore();
const { snapshot, winner } = storeToRefs(store);
const { gameService } = store;

const themeId = computed(() => theme.value);
const { config: resolvedTheme } = useResolvedThemeConfig(themeId);

const winnerCfg = computed<LandscapeWinnerConfig | null>(() => {
  return resolvedTheme.value?.landscape?.[props.game]?.winner ?? null;
});

const winnerFrameSrc = computed(() => {
  const cfg = winnerCfg.value;
  if (!cfg) return null;
  if (winner.value?.type === "Us") return cfg.frameUsSrc ?? null;
  if (winner.value?.type === "Them") return cfg.frameThemSrc ?? null;
  return cfg.frameUsSrc ?? cfg.frameThemSrc ?? null;
});

const winnerDataStyle = computed(() => {
  const cfg = winnerCfg.value;
  if (!cfg) return {};
  const style: Record<string, string> = {
    top: `${cfg.nameTopPx}px`,
  };
  if (cfg.nameLeftPx != null) {
    style.justifyContent = "flex-start";
    style.paddingLeft = `${cfg.nameLeftPx}px`;
  }
  return style;
});

const winnerNameStyle = computed(() => {
  const cfg = winnerCfg.value;
  if (!cfg) return {};
  const style: Record<string, string> = {};
  if (cfg.nameFontSizePx != null) style.fontSize = `${cfg.nameFontSizePx}px`;
  if (cfg.nameHeightPx != null) {
    style.height = `${cfg.nameHeightPx}px`;
    style.lineHeight = `${cfg.nameHeightPx}px`;
    style.display = "flex";
    style.alignItems = "center";
  }
  if (cfg.nameColor) {
    style.color = cfg.nameColor;
    style.backgroundImage = "none";
    style.webkitTextFillColor = cfg.nameColor;
  }
  const font = themeFontCss(cfg.nameFontFamily);
  if (font) style.fontFamily = `"${font}"`;
  return style;
});

const mediaElm = ref<HTMLVideoElement>();
const winnerComp = ref<HTMLElement | null>(null);
const winnerData = ref<HTMLElement | null>(null);
const winnerImage1 = ref<HTMLElement | null>(null);
const winnerImage2 = ref<HTMLElement | null>(null);
const currentWinnerState = ref<string | null>(null);
const lastHandledSendState = ref<string | null>(null);
let mountTimeline: gsap.core.Timeline | null = null;
let unmountTimeline: gsap.core.Timeline | null = null;

function playerSlotStyle(slot: LandscapeWinnerPlayerSlot) {
  return {
    left: `${slot.leftPx}px`,
    top: `${slot.topPx}px`,
    width: `${slot.widthPx}px`,
    height: `${slot.heightPx}px`,
    transform: `rotate(${slot.rotateDeg}deg)`,
  };
}

function playerSrc(index: number, fallback: string) {
  const url = winner.value?.players?.[index]?.url;
  return url || fallback;
}

function overlayEls(): HTMLElement[] {
  return [winnerData.value, winnerImage1.value, winnerImage2.value].filter(
    (el): el is HTMLElement => el != null,
  );
}

async function waitForWinnerDom(tries = 40): Promise<boolean> {
  for (let i = 0; i < tries; i++) {
    await nextTick();
    if (mediaElm.value && winnerComp.value && winnerData.value) return true;
    await new Promise((r) => setTimeout(r, 16));
  }
  return !!(mediaElm.value && winnerComp.value && winnerData.value);
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

const winnerStateKey = computed(() => {
  if (snapshot.value.matches("winner.intro")) return "winner.intro";
  if (snapshot.value.matches("winner.main")) return "winner.main";
  return null;
});

function sendOnce(stateKey: string, type: string, payload?: Record<string, unknown>) {
  const key = `${stateKey}:${type}`;
  if (lastHandledSendState.value === key) return;
  gameService.send({ type, ...payload } as never);
  lastHandledSendState.value = key;
}

function playVideo(atSec: number, playbackRate = 1) {
  const video = mediaElm.value;
  if (!video) return;
  void playVideoFrom(video, atSec, playbackRate);
}

function pauseVideo() {
  pauseVideoOnly(mediaElm.value);
}

const winnerMount = () => {
  const cfg = winnerCfg.value;
  const els = overlayEls();
  if (!cfg || !els.length) return;
  mountTimeline?.kill();
  gsap.set(els, { opacity: 0 });
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

const winnerUnMount = () => {
  const cfg = winnerCfg.value;
  if (!cfg || !winnerComp.value) return;
  unmountTimeline?.kill();
  unmountTimeline = gsap.timeline();
  unmountTimeline.to(winnerComp.value, {
    duration: cfg.unmountCompFadeSec,
    opacity: 0,
    ease: "linear",
  });
};

let applyGeneration = 0;

async function applyWinnerState(newState: string) {
  const cfg = winnerCfg.value;
  if (!cfg) return;

  const generation = ++applyGeneration;
  currentWinnerState.value = newState;
  lastHandledSendState.value = null;

  const domReady = await waitForWinnerDom();
  if (generation !== applyGeneration) return;
  if (!domReady || !mediaElm.value) return;

  await waitForVideoMetadata(mediaElm.value);
  if (generation !== applyGeneration) return;

  if (newState === "winner.intro") {
    const video = mediaElm.value;
    if (!video) return;
    await playVideoFrom(video, cfg.introStartSec, 1, {
      isCancelled: () => generation !== applyGeneration,
    });
    if (generation !== applyGeneration) return;
    winnerMount();
    const reached = await waitForVideoMediaTime(video, cfg.introEndSec, {
      isCancelled: () =>
        generation !== applyGeneration ||
        currentWinnerState.value !== newState,
    });
    if (!reached) return;
    if (generation !== applyGeneration) return;
    if (currentWinnerState.value !== newState) return;
    pauseVideo();
    sendOnce(newState, "NEXT");
  }

  if (newState === "winner.main") {
    pauseVideo();
    await sleep(cfg.mainHoldMs);
    if (generation !== applyGeneration) return;
    if (currentWinnerState.value !== newState) return;
    winnerUnMount();
    sendOnce(newState, "UPDATE_CONTEXT", { ended: false });
    sendOnce(newState, "NEW_GAME");
  }
}

watch(
  [winnerStateKey, winnerCfg],
  ([newState], [oldState, oldCfg]) => {
    if (!newState || !winnerCfg.value) return;

    const stateChanged = newState !== oldState;
    const cfgJustReady = !oldCfg && !!winnerCfg.value;
    const videoChanged =
      !!oldCfg &&
      !!winnerCfg.value &&
      oldCfg.video !== winnerCfg.value.video;

    if (!stateChanged && !cfgJustReady && !videoChanged) return;

    const sameStateAlreadyHandled =
      !stateChanged && currentWinnerState.value === newState && !videoChanged;
    if (sameStateAlreadyHandled && !cfgJustReady) return;

    void applyWinnerState(newState);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  applyGeneration++;
  mountTimeline?.kill();
  unmountTimeline?.kill();
  mountTimeline = null;
  unmountTimeline = null;
});
</script>

<style scoped>
.winnerComp {
  @apply relative;
}

.video {
  @apply relative z-[-1] left-0 top-0;
}

.winnerData {
  @apply absolute h-[1080px] w-[1920px] flex justify-center items-center z-[10] text-4xl opacity-0;
  font-family: "arefBold";
}

.winnerName {
  @apply text-start m-0 p-0 text-transparent bg-clip-text;
  background-image: linear-gradient(
    to right,
    #462523 0%,
    #cb9b51 22%,
    #f6e27a 45%,
    #f6f2c0 50%,
    #f6e27a 55%,
    #cb9b51 78%,
    #462523 100%
  );
  -webkit-background-clip: text;
}

.winnerNameSolid {
  @apply bg-clip-border;
  -webkit-background-clip: border-box;
  background-image: none;
}

.playersLayer {
  @apply absolute h-[1080px] w-[1920px] flex justify-center gap-5 items-center;
}

.playersInner {
  @apply relative;
}

.playerSlot {
  @apply absolute z-[-2];
}

.playerFrame {
  @apply absolute z-[10] left-0 top-0 pointer-events-none;
}

.playerImg {
  @apply opacity-0 relative;
}
</style>
