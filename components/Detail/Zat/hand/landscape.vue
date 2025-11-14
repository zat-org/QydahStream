<template>
  <div class="score-comp">
    <video
      ref="mediaElm"
      class="video-elm"
      muted
      :src="'/videos/zat/Full_Score.webm'"
      height="1080"
      width=" 1920"></video>
    <div class="TeamWrap left-[1062px]" ref="team1wrapper">
      <img
        class="TeamSponsor right-[0px]"
        :src="'/images/zat/zat_white.svg'" />
      <p class="TeamName left-[84px]">
        {{ usName }}
      </p>

      <p id="team1totalScore" class="TeamScore left-0">
        {{ usScore }}
      </p>
      <div id="team1-detailed-scores" class="TeamDetailedScore left-0">
        <p class="score" v-for="sc in usTeamRounds">{{ sc }}</p>
      </div>
    </div>

    <div class="TeamWrap left-[364px]" ref="team2wrapper">
      <p class="TeamScore right-0">{{ themScore }}</p>

      <p class="TeamName left-[115px]">
        {{ themName }}
      </p>

      <img class="TeamSponsor left-[12px]" :src="'/images/zat/zat_black.svg'" />

      <div class="TeamDetailedScore right-0">
        <p class="score" v-for="sc in themTeamRounds">{{ sc }}</p>
      </div>
    </div>
  </div>  
</template>

<script lang="ts" setup>
import { until } from "@vueuse/core";
import gsap from "gsap";
const { sleep } = useSleep();
const store = useMyHandGameStore();
const { snapshot, themName, usName, themScore, usScore, themTeamRounds, usTeamRounds } = storeToRefs(store);
const { gameService } = store;

const mediaElm = ref<HTMLVideoElement>();
const team1wrapper = useTemplateRef('team1wrapper');
const team2wrapper = useTemplateRef('team2wrapper');

const intro_start_sec = 0;
const intro_end_sec = 3.22;
const score_sec = intro_end_sec;
const outro_start = score_sec;

// Animation state guards
const isAnimating = ref(false);
const currentState = ref<string | null>(null);

// Get a unique state identifier to track state changes
const stateIdentifier = computed(() => {
  const state = snapshot.value;
  if (!state) return null;
  // Create a unique identifier for the current state
  if (state.matches("detail.intro")) return "detail.intro";
  if (state.matches("detail.main")) return "detail.main";
  if (state.matches("detail.outro")) return "detail.outro";
  return state.value?.toString() || null;
});

const scoreMount = () => {
  if (isAnimating.value) return; // Prevent re-animation
  isAnimating.value = true;
  const t1 = gsap.timeline();
  t1.delay(1.75);
  t1.fromTo(
    [team1wrapper.value, team2wrapper.value],
    { opacity: 0 },
    {
      duration: 0.75,
      opacity: 1,
      ease: "linear",
      onComplete: () => {
        isAnimating.value = false;
      }
    }
  );
};

const scoreUnMount = () => {
  if (isAnimating.value) return; // Prevent re-animation
  isAnimating.value = true;
  const t2 = gsap.timeline();
  t2.to(
    [team1wrapper.value, team2wrapper.value],
    {
      duration: 0.3,
      opacity: 0,
      ease: "linear",
      onComplete: () => {
        isAnimating.value = false;
      }
    }
  );
};

// Use watch instead of watchEffect with specific dependency
// Only watch the state identifier, not all reactive data
onMounted(() => {
  watch(
    stateIdentifier,
    async (newState, oldState) => {
      // Only proceed if state actually changed
      if (newState === oldState || !newState) return;

      // Prevent duplicate state handling
      if (currentState.value === newState) return;
      currentState.value = newState;

      if (snapshot.value.matches("detail.intro")) {
        if (mediaElm.value) {
          mediaElm.value.currentTime = intro_start_sec;
          mediaElm.value.play();
          scoreMount();
          await sleep(intro_end_sec * 1000);
          mediaElm.value.currentTime = score_sec;
          mediaElm.value.pause();
          // await until(isAnimating).toBe(false);
          gameService.send({ type: "NEXT" });
        }
      }

      if (snapshot.value.matches("detail.main")) {
        if (mediaElm.value) {
          mediaElm.value.currentTime = score_sec;
        }
        await sleep(2000);
        // await until(isAnimating).toBe(false);
        gameService.send({ type: "TO_OUTRO" });
      }

      if (snapshot.value.matches("detail.outro")) {
        if (mediaElm.value) {
          mediaElm.value.currentTime = outro_start;
          mediaElm.value.playbackRate = 3;
          mediaElm.value.onended = () => {
            gameService.send({ type: "CHECK_END" });
          };
          mediaElm.value.play();
          scoreUnMount();
          // await sleep(2000);
          // await until(isAnimating).toBe(false);
        }
      }
    },
    { immediate: true } // Run on mount
  );
});
</script>
<style scoped>
/* .detailed-score-comp {
} */
/*
  Based on TailwindCSS recommendations,
  consider using classes instead of the `@apply` directive
  @see https://tailwindcss.com/docs/reusing-styles#avoiding-premature-abstraction
*/
.video-elm {
  @apply relative z-[-1] left-0 top-0;
  /* background-color: aquamarine; */
}

.TeamWrap {
  @apply text-[white] text-center w-[499px] h-[97px] absolute opacity-0 top-[62px];
  font-family: "arefBold";
}

.TeamName {
  @apply absolute text-[2rem] h-[81px] flex justify-center items-center top-2 w-[300px];
}

.TeamScore {
  @apply absolute text-[2.2rem] w-[85px] h-[97px] flex justify-center items-center top-0;
  font-family: "CairoSemiBold";
}

.TeamSponsor {
  @apply absolute w-[110px] h-[100px] top-[-5px];
}

.TeamDetailedScore {
  @apply text-[white] absolute w-[85px] text-[1.8rem] top-[125px];
  font-family: "CairoSemiBold";
}

.score {
  @apply font-extrabold text-4xl leading-[3rem] m-0 p-0;
}
</style>
