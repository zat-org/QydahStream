<template>
  <div class="flex justify-center relative mx-auto" :style="BoardStyles.dimension">
    <div class="relative  w-full origin-center top-[0px]" :style="BoardStyles.scorePanel">
      <QydhaSvg ref="svgQydha" class="absolute top-0 left-0" />

      <div class="absolute text-center text-white flex w-full bottom-[0px]">
        <div class="w-[52.5%] flex  justify-between items-center relative" ref="team2wrapper">
          <transition name="fade" mode="out-in">
            <p class="w-[70%] text-center " :key="themName" :style="BoardStyles.scorePanel.leftTeam.name">
              {{ themName }}
            </p>
          </transition>
          <p class="score w-[30%] mx-auto text-center" :style="BoardStyles.scorePanel.leftTeam.score">
            {{ themScore }}
          </p>
        </div>
        <div class=" w-[2.5%] "></div>
        <div class="w-[50.5%] flex justify-between items-center relative" ref="team1wrapper">
          <p class="score w-[30%] text-center mx-auto" :style="BoardStyles.scorePanel.rightTeam.score">
            {{ usScore }}
          </p>
          <transition name="fade" mode="out-in">
            <p class=" w-[70%] mx-auto text-center" :key="usName" :style="BoardStyles.scorePanel.rightTeam.name">
              {{ usName }}
            </p>
          </transition>
        </div>
      </div>
      <div class="absolute flex gap-5 w-full justify-center top-[350px]" ref="score">
        <div class="TeamDetailedScore text-right grow">
          <p class="score" v-for="sc, index in themTeamRounds" :key="['themscore', index].toString()"
            :style="BoardStyles.detailScore">
            {{ sc }}
          </p>
        </div>
        <div class="bg-gradient-to-b from-transparent via-orange-500 to-transparent w-[10px] h-[50vh] rounded-lg"></div>
        <div class="TeamDetailedScore grow">
          <p class="score" v-for="sc, index in usTeamRounds" :key="['usscore', index].toString()"
            :style="BoardStyles.detailScore">
            {{ sc }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import gsap from "gsap";
const { sleep } = useSleep();
const store = useMyHandGameStore();
const { snapshot, themName, usName, themScore, usScore, themTeamRounds, usTeamRounds, BoardStyles } = storeToRefs(store);

const { gameService } = store;

const svgQydha = ref();


// gsap elements
const team1wrapper = ref(null);
const team2wrapper = ref(null);
const score = ref(null);

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




// balot not hand game








const scoreMount = () => {
  if (isAnimating.value) return; // Prevent re-animation
  console.log("start score mount ");
  isAnimating.value = true;
  const t1 = gsap.timeline();
  t1.delay(2);
  t1.fromTo(
    [team1wrapper.value, team2wrapper.value, score.value],
    { opacity: 0 },
    {
      duration: 2,
      opacity: 1,
      ease: "linear",
      onComplete: () => {
        isAnimating.value = false;
        console.log("animate of mount end ")
      }
    }
  );
};

const scoreUnMount = () => {
  if (isAnimating.value) return; // Prevent re-animation
  isAnimating.value = true;
  const t2 = gsap.timeline();
  t2.to([team1wrapper.value, team2wrapper.value, score.value], {
    duration: 0.3,
    opacity: 0,
    ease: "linear",
    onComplete: () => {
      isAnimating.value = false;
    }
  });
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
        if (svgQydha.value && !isAnimating.value) {

          svgQydha.value.enteranimation();
          scoreMount();
          console.log("after watinf ")
          await sleep(4000);
          if (!isAnimating.value) {
            gameService.send({ type: "NEXT" });
          }
        }
      }

      if (snapshot.value.matches("detail.main")) {
        await sleep(3000);
        if (!isAnimating.value) {
          gameService.send({ type: "TO_OUTRO" });
        }
      }

      if (snapshot.value.matches("detail.outro")) {
        if (svgQydha.value && !isAnimating.value) {
          svgQydha.value.outAnimation();
          scoreUnMount();
          await sleep(2000);
          if (!isAnimating.value) {
            gameService.send({ type: "CHECK_END" });
          }
        }
      }
    },
    { immediate: true } // Run on mount
  );
});
</script>
<style scoped>
.TeamDetailedScore {
  @apply w-[25%] text-[2rem] text-gray-600;
  font-family: "CairoSemiBold";
}

.score {
  @apply text-[2.5rem] text-gray-600;
  font-family: "CairoSemiBold";
}

* {
  font-family: "arefBold";
}
</style>
