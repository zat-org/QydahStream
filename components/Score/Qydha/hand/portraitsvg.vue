<template>
  <!--  MAIN DIMENSION  -->
  <div class="flex justify-center relative mx-auto duration-300 transition-all" :style="BoardStyles.dimension">
    <!--  SCORE PANEL -->
    <div class="relative w-full  origin-center  transition-all duration-300" :style="BoardStyles.scorePanel">
      <!-- LOGO -->
      <QydhaSvg ref="svgQydha" class="absolute top-0 left-0" />
      <!--  TEAMS  -->
      <div class="absolute  text-white flex w-full  bottom-[0px]">
        <!-- LEFT TEAM  -->
        <div class="w-[52.5%] flex justify-between items-center relative " ref="team2wrapper">
          <transition name="fade" mode="out-in">
            <!-- LEFT TEAM NAME -->

            <p class="  w-[70%] mx-auto text-center   " :key="themName" style="
                user-select: none;
                white-space: nowrap;
                letter-spacing: -0.5px;
                word-spacing: -1px;
              " :style="BoardStyles.scorePanel.leftTeam.name">
              {{ themName }}
            </p>
          </transition>
          <!-- LEFT TEAM SCORE -->
          <p class="  score  w-[30%] mx-auto text-center  " :style="BoardStyles.scorePanel.leftTeam.score">
            {{  displayScore1 }}
          </p>
        </div>
        <!-- EMPTY SPACE -->
        <div class=" w-[2.5%] flex items-center justify-center relative  " ref="roundNumberWrapper" > 
        <p class= "absolute top-[10px] left-[-15px] text-white text-center text-[2.5rem]  bg-[#252A56] rounded-full w-14 h-14   flex items-center justify-center">
          {{ roundNumber }}
        </p>
        
         </div>
        <!-- RIGHT TEAM  -->
        <div class="w-[50.5%] flex justify-between    items-center relative " ref="team1wrapper">

          <!-- RIGHT TEAM SCORE -->
          <p class=" score  w-[30%] mx-auto text-center  " :style="BoardStyles.scorePanel.rightTeam.score">
            {{ displayScore2 }}
          </p>
          <transition name="fade" mode="out-in">
            <!-- RIGHT TEAM NAME -->
            <p class="w-[70%] mx-auto text-center" :key="usName" style="
                user-select: none;
                white-space: nowrap;
                letter-spacing: -0.5px;
                word-spacing: -1px;
              " :style="BoardStyles.scorePanel.rightTeam.name">
              {{ usName }}
            </p>
          </transition>
        </div>
      </div>

      <div ref="commentWrapper" class="  h-full   flex items-end justify-center  translate-x-[10px] mt-[45px]  "
      :style="{ pointerEvents: 'none'  }">
      <div class="  px-2   rounded-lg shadow-lg comment ">
        <span >
          {{ comment }}
        </span>
      </div>
    </div>
    </div>
    <!-- leftPlayer Image -->
    <transition name="fade" mode="out-in">
      <div class="absolute playerImage transition-all duration-300" :key="left.imageUrl" :style="BoardStyles.leftPlayer"
        v-if="left && left.imageUrl && showPlayers">
        <div class="relative w-full h-full">
          <img class="absolute z-[10] rounded-2xl" :src="left.imageUrl" :style="playerImageStyle" />
          <!-- :style="{ 'background-image': `url(${left.url}) ` }" -->
          <img class="absolute z-[10] w-full h-full" src="/images/left-square.svg" />
        </div>
      </div>
    </transition>
    <!-- rightPlayerImage -->
    <transition name="fade" mode="out-in">
      <div class="absolute origin-center playerImage transition-all duration-300" :key="right.imageUrl"
        :style="BoardStyles.rightPlayer" v-if="right && right.imageUrl && showPlayers">
        <div class="relative w-full h-full">
          <img class="absolute z-[10] rounded-2xl" :src="right.imageUrl" :style="playerImageStyle" />
          <!-- :style="{ 'background-image': `url(${right.url}) ` }" -->
          <img class="absolute z-[10] rotate-180 w-full h-full" src="/images/right-square.svg" />
        </div>
      </div>
    </transition>
    <!-- bottomPlayerImage -->
    <transition name="fade" mode="out-in">
      <div class="absolute origin-center playerImage transition-all duration-300" :key="bottom.imageUrl"
        :style="BoardStyles.bottomPlayer" v-if="bottom && bottom.imageUrl && showPlayers">
        <div class="relative rounded-xl w-full h-full">
          <img class="absolute z-[10] rounded-2xl" :src="bottom.imageUrl  " :style="playerImageStyle" />
          <!-- :style="{ 'background-image': `url(${bottom.url})` }" -->
          <img class="absolute z-[10] rotate-270 w-full h-full" src="/images/bottom-square.svg" />
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import gsap from "gsap";
import { until } from '@vueuse/core'

const store = useMyHandGameStore();
const { snapshot, themName,usName,themScore,usScore,BoardStyles,bottom,left,right,comment,roundNumber } =storeToRefs(store);
const { gameService } = store;

const { sleep } = useSleep();

const route = useRoute();
let showPlayers = route.query.showPlayers?.toString() ?? "false";
showPlayers = JSON.parse(showPlayers);

const svgQydha = ref();






const playerImageStyle = computed(() => {
  return {
    width: "90%",
    height: "90%",
    left: "5%",
    top: "5%",
  }
})



const team1wrapper = useTemplateRef('team1wrapper');
const team2wrapper = useTemplateRef('team2wrapper');
const roundNumberWrapper = useTemplateRef('roundNumberWrapper');
const commentWrapper = useTemplateRef('commentWrapper')

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
  }else{
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
  t1.delay(2);
  t1.fromTo(
    [team1wrapper.value, team2wrapper.value, commentWrapper.value, roundNumberWrapper.value],
    { opacity: 0 },
    {
      duration: 1,
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
  }else{

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
  }).to(
    ".playerImage",
    {
      duration: 0.3,
      opacity: 0,
      ease: "linear",
      onComplete: () => {
        isAnimating.value = false;
      }
    },
    "<"
  );
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
        if (svgQydha.value && !isAnimating.value) {
          svgQydha.value.enteranimation();
          scoreMount(
            themScore.value!,
            usScore.value!,
          );
          await until(isAnimating).toBe(false);
            gameService.send({ type: "NEXT" });

        }
      }
      
      if (snapshot.value.matches("score.main")) {
        if (!isAnimating.value) {
          mainScoreMount(
            themScore.value!,
            usScore.value!
          );
        }
      }

      if (snapshot.value.matches("score.outro")) {
        console.log("outro");
        console.log(svgQydha.value )
        console.log(isAnimating.value)
        if (svgQydha.value ) {
          scoreUnMount();
          svgQydha.value!.outAnimation();
          await until(isAnimating).toBe(false);
          await sleep(1000);
          console.log(" wating  un mount end ")
            gameService.send({ type: "NEXT" });
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
        
        (newThemScore !== oldThemScore || newUsScore !== oldUsScore) &&
        !isAnimating.value
      ) {

        mainScoreMount(newThemScore ?? 0, newUsScore ?? 0);
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
  @apply text-slate-700 text-[2.5rem];
  font-family: "CairoSemiBold";
}

.teamName {
  @apply absolute w-[85px] text-[1rem] h-[40px] flex justify-end items-center top-1.5;
}

.teamWrap {
  @apply text-[white] text-center w-[50px] h-[62px] absolute opacity-100 top-[58px];
}

.SponsorImage {
  @apply absolute w-[66px] h-[62px] -top-0.5;
}

.video {
  @apply z-[-1];
}
.comment {
  @apply px-4 w-fit ;
  scale:4;
  transform-origin: top center;
  background: linear-gradient(90deg, #252A56 0%, #31386b 100%);
  border: 3px solid #FB9B6E;
  color: white;
  font-family: "arefBold";
  /* font-size: 1.5rem; */
  text-align: center;
  filter: drop-shadow(0 4px 16px #0008) ;
}

* {
  font-family: "arefBold";
}
</style>
