<template>
  <div>
    <video ref="mediaElm" class="video" muted height="1080" width="1920"
      src="/videos/qydha/landscape/Corner_Score.webm"></video>
    <div class="left-[970px] opacity-0 teamWrap" ref="team1wrapper">
      <transition name="fade" mode="out-in">
        <p :key="usName" class="left-14 teamName">
          {{ usName }}
        </p>
      </transition>
      <p class="left-[5px] score">
        {{

          displayScore1
        }}
      </p>
    </div>

    <div class=" absolute top-0 left-0 mt-[131px] ml-[948px] w-[20px] h-[28px]  opacity-0   flex items-center justify-center   "
      ref="roundNumberWrapper">
      <p
        class=" text-white text-center text-[1.1rem]  bg-[#252A56]  rounded-full w-full h-full   flex items-center justify-center">
        {{ roundNumber }}
      </p>
    </div>
    <div class="left-[621px] opacity-0 teamWrap" ref="team2wrapper">
      <p class="right-[5px] score">
        {{

          displayScore2
        }}
      </p>
      <transition name="fade" mode="out-in">
        <p :key="themName" class="teamName left-[82px]">
          {{ themName }}
        </p>
      </transition>
    </div>

    <div ref="commentWrapper" dir="rtl"
      class="absolute flex justify-center opacity-0 items-center mt-[170px] top-0 left-0 w-[1920px] z-20"
      :style="{ pointerEvents: 'none' }">
      <div class="px-4 py-2 rounded-xl shadow-lg comment" dir="rtl">
        <span style="text-shadow: 0 2px 6px #000c, 0 0 2px #FDCA53aa;">
          {{ comment }}
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import gsap from "gsap";
import { until } from '@vueuse/core'

const { sleep } = useSleep();

const store = useMyHandGameStore();
const { snapshot, usName, themName, themScore, usScore, comment, roundNumber } = storeToRefs(store);
const { gameService } = store;

const mediaElm = ref<HTMLVideoElement>();
const intro_start_sec = 0;
const intro_end_sec = 3.5;
const score_sec = intro_end_sec;
const outro_start = score_sec;

const team1wrapper = useTemplateRef('team1wrapper');
const team2wrapper = useTemplateRef('team2wrapper');
const commentWrapper = useTemplateRef('commentWrapper');
const roundNumberWrapper = useTemplateRef('roundNumberWrapper');

const tweenedScores = reactive<{ team1: string | number, team2: string | number }>({
  team1: 0,
  team2: 0,
});

// Computed properties to safely display scores (handle both string and number)
const displayScore1 = computed(() => {
  const score = tweenedScores.team1;
  return typeof score === 'number' ? score.toFixed(0) : score;
});

const displayScore2 = computed(() => {
  const score = tweenedScores.team2;
  return typeof score === 'number' ? score.toFixed(0) : score;
});

// Animation state guards
const isAnimating = ref(false);
const currentState = ref<string | null>(null);

// Get a unique state identifier to track state changes
const stateIdentifier = computed(() => {
  const state = snapshot.value;
  if (!state) return null;
  // Create a unique identifier for the current state
  if (state.matches("score.intro")) return "score.intro";
  if (state.matches("score.main")) return "score.main";
  if (state.matches("score.outro")) return "score.outro";
  return state.value?.toString() || null;
});

const mainScoreMount = (score1: string | number, score2: string | number) => {
  if (isAnimating.value) return; // Prevent re-animation
  isAnimating.value = true;
  const t1 = gsap.timeline();
  if (typeof score1 === "string" || typeof score2 === "string") {
    tweenedScores.team1 = score1;
    tweenedScores.team2 = score2;
    isAnimating.value = false; // Reset animation flag for string scores
  } else {
    t1.to(
      tweenedScores,
      {
        team1: score1,
        team2: score2,
        duration: 0.75,
        onComplete: () => {
          isAnimating.value = false;
        }
      },
    );
  }
};

const scoreMount = (score1: string | number, score2: string | number) => {
  if (isAnimating.value) return; // Prevent re-animation
  isAnimating.value = true;
  const t1 = gsap.timeline();
  t1.fromTo(
    [team1wrapper.value, team2wrapper.value, commentWrapper.value, roundNumberWrapper.value],
    { opacity: 0 },
    {
      duration: .5,
      opacity: 1,
      ease: "linear",
    }
  )
  if (typeof score1 === "string" || typeof score2 === "string") {
    tweenedScores.team1 = score1;
    tweenedScores.team2 = score2;
    // Note: isAnimating will be set to false after the opacity animation completes
    t1.call(() => {
      isAnimating.value = false;
    });
  } else {
    t1.to(
      tweenedScores,
      {
        team1: score1,
        team2: score2,
        duration: 0.75,
        onComplete: () => {
          isAnimating.value = false;
        }
      },
      "<"
    );
  }
};

const scoreUnMount = () => {
  if (isAnimating.value) return; // Prevent re-animation
  isAnimating.value = true;
  const t2 = gsap.timeline();
  t2.to([team1wrapper.value, team2wrapper.value, commentWrapper.value, roundNumberWrapper.value], {
    duration: 0.3,
    opacity: 0,
    ease: "linear",
    onComplete: () => {
      isAnimating.value = false;
    }
  });
};

onMounted(() => {
  // Use watch instead of watchEffect with specific dependency
  // Only watch the state identifier, not all reactive data
  watch(
    stateIdentifier,
    async (newState, oldState) => {
      // Only proceed if state actually changed
      if (newState === oldState || !newState) return;
      
      // Prevent duplicate state handling
      if (currentState.value === newState) return;
      currentState.value = newState;

      if (snapshot.value.matches("score.intro")) {
        if (mediaElm.value ) {
          mediaElm.value.currentTime = intro_start_sec;
          mediaElm.value.play();
          await sleep(intro_end_sec * 1000 );
          mediaElm.value.pause();
          // await until(isAnimating).toBe(false);
          mediaElm.value.currentTime = score_sec;
          scoreMount(
            usScore.value!,
            themScore.value!
          );
          gameService.send({ type: "NEXT" });
        }
      }
      
      if (snapshot.value.matches("score.main")) {
        if (mediaElm.value) {
          mediaElm.value.currentTime = score_sec;
        }
        if (!isAnimating.value) {
          mainScoreMount(
            usScore.value!,
            themScore.value!
          );
        }
      }
    
      if (snapshot.value.matches("score.outro")) {
        if (mediaElm.value) {
          mediaElm.value.currentTime = outro_start+1;
          mediaElm.value.playbackRate = 3;
          mediaElm.value.onended = () => {
            gameService.send({ type: "NEXT" });
          };
          mediaElm.value.play();
          // await sleep(500);
          scoreUnMount();
        }
      }
    },
    { immediate: true } // Run on mount
  );

  // Watch for score changes in score.main state only
  watch(
    [themScore, usScore],
    ([newThemScore, newUsScore], [oldThemScore, oldUsScore]) => {
      // Only update scores if we're in main state and scores actually changed
      if (
        snapshot.value?.matches("score.main") &&
        (newThemScore !== oldThemScore || newUsScore !== oldUsScore) &&
        !isAnimating.value
      ) {
        mainScoreMount(newUsScore ?? 0, newThemScore ?? 0);
      }
    }
  );
});
</script>
<style scoped>
.fade-enter-active,
.fade-leave-active {
  @apply transition-opacity duration-[1s] ease-[ease];
}

.fade-enter-from,
.fade-leave-to

/* .fade-leave-active in <2.1.8 */
  {
  @apply opacity-0;
}

.score {
  @apply text-slate-700 absolute text-[clamp(1.5rem,1.5rem,1.7rem)] w-[55px] h-[55px] flex justify-center items-center top-0;
  font-family: "CairoSemiBold";
}

.teamName {
  @apply absolute w-[185px] text-[1.5rem] h-[40px] flex justify-center items-center top-1.5;
  font-family: "arefBold";

}

.teamWrap {
  @apply text-[white] text-center w-[324px] h-[62px] absolute  top-[118px];
}

.video {
  @apply relative top-0 left-0 z-[-1];
}

.wrapcomp {
  @apply relative h-screen w-screen;
}

.SponsorImage {
  @apply absolute w-[66px] h-[62px] -top-0.5;
}

.comment {
  @apply px-4;
  background: linear-gradient(90deg, #252A56 0%, #31386b 100%);
  border: 3px solid #FB9B6E;
  color: white;
  font-family: "arefBold";
  font-size: 1.5rem;
  text-align: center;
  filter: drop-shadow(0 4px 16px #0008);
}
</style>
