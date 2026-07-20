<template>
  <div v-if="scoreCfg">
    <video
      ref="mediaElm"
      class="video"
      muted
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
 * Step 1 pilot: Baloot only — reads skin from theme config, numbers from Baloot store.
 */
import gsap from "gsap";
import { getThemeConfig } from "~/config/themes";
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

const scoreCfg = computed<LandscapeScoreConfig | null>(() => {
  return getThemeConfig(theme.value)?.landscape?.[props.game]?.score ?? null;
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

const scoreMount = (score1: number, score2: number) => {
  const cfg = scoreCfg.value;
  if (!cfg) return;
  mountTimeline?.kill();
  mountTimeline = gsap.timeline();
  mountTimeline.delay(cfg.mountDelaySec);
  mountTimeline
    .fromTo(
      [team1wrapper.value, team2wrapper.value],
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
  if (!cfg) return;
  unmountTimeline?.kill();
  unmountTimeline = gsap.timeline();
  unmountTimeline.to([team1wrapper.value, team2wrapper.value], {
    duration: cfg.unmountFadeSec,
    opacity: 0,
    ease: "linear",
  });
};

const mainScoreMount = (score1: number, score2: number) => {
  const cfg = scoreCfg.value;
  if (!cfg) return;
  mainTimeline?.kill();
  mainTimeline = gsap.timeline();
  mainTimeline.to(tweenedScores, {
    team1: score1,
    team2: score2,
    duration: cfg.scoreTweenSec,
  });
};

onMounted(() => {
  watch(
    scoreStateKey,
    async (newState, oldState) => {
      const cfg = scoreCfg.value;
      if (!cfg || !newState || newState === oldState) return;
      if (currentScoreState.value === newState) return;
      currentScoreState.value = newState;
      if (newState !== oldState) {
        lastHandledSendState.value = null;
      }

      const s1 = last_sakka.value?.usSakkaScore ?? 0;
      const s2 = last_sakka.value?.themSakkaScore ?? 0;

      if (newState === "score.intro") {
        if (mediaElm.value) {
          mediaElm.value.currentTime = cfg.introStartSec;
          mediaElm.value.playbackRate = 1;
          void mediaElm.value.play();
        }
        scoreMount(s1, s2);
        await sleep(cfg.introEndSec * 1000);
        if (currentScoreState.value !== newState) return;
        if (mediaElm.value) {
          mediaElm.value.pause();
          mediaElm.value.currentTime = cfg.introEndSec;
        }
        sendNextOnceForState(newState);
      }

      if (newState === "score.main") {
        if (mediaElm.value) {
          mediaElm.value.currentTime = cfg.introEndSec;
        }
        mainScoreMount(s1, s2);
      }

      if (newState === "score.outro") {
        if (mediaElm.value) {
          mediaElm.value.currentTime = cfg.introEndSec;
          mediaElm.value.playbackRate = cfg.outroPlaybackRate;
          mediaElm.value.onended = () => {
            if (currentScoreState.value !== newState) return;
            sendNextOnceForState(newState);
          };
          void mediaElm.value.play();
        }
        scoreUnMount();
      }
    },
    { immediate: true },
  );
});

onBeforeUnmount(() => {
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
  @apply text-[white] text-center absolute opacity-100;
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
