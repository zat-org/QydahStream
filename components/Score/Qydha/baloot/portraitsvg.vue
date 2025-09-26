<template>
  <!--  MAIN DIMENSION  -->
  <div class="flex justify-center relative mx-auto duration-300 transition-all" v-if="BoardStyles" :style="BoardStyles.dimension">
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
            {{ gameState == "Ended" ? themGameScore : tweenedScores.team1.toFixed(0) }}
          </p>
        </div>
        <!-- EMPTY SPACE -->
        <div class=" w-[2.5%] "></div>
        <!-- RIGHT TEAM  -->
        <div class="w-[50.5%] flex justify-between    items-center relative " ref="team1wrapper">

          <!-- RIGHT TEAM SCORE -->
          <p class=" score  w-[30%] mx-auto text-center  " :style="BoardStyles.scorePanel.rightTeam.score">
            {{ gameState == "Ended" ? usGameScore : tweenedScores.team2.toFixed(0) }}
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
    </div>
    <!-- leftPlayer Image -->
    <transition name="fade" mode="out-in">
      <div class="absolute playerImage transition-all duration-300" :key="left.url" :style="BoardStyles.leftPlayer"
        v-if="left && left.url && showPlayers">
        <div class="relative w-full h-full">
          <img class="absolute z-[10] rounded-2xl" :src="left.url" :style="playerImageStyle" />
          <!-- :style="{ 'background-image': `url(${left.url}) ` }" -->
          <img class="absolute z-[10] w-full h-full" src="/images/left-square.svg" />
        </div>
      </div>
    </transition>
    <!-- rightPlayerImage -->
    <transition name="fade" mode="out-in">
      <div class="absolute origin-center playerImage transition-all duration-300" :key="right.url"
        :style="BoardStyles.rightPlayer" v-if="right && right.url && showPlayers">
        <div class="relative w-full h-full">
          <img class="absolute z-[10] rounded-2xl" :src="right.url" :style="playerImageStyle" />
          <!-- :style="{ 'background-image': `url(${right.url}) ` }" -->
          <img class="absolute z-[10] rotate-180 w-full h-full" src="/images/right-square.svg" />
        </div>
      </div>
    </transition>
    <!-- bottomPlayerImage -->
    <transition name="fade" mode="out-in">
      <div class="absolute origin-center playerImage transition-all duration-300" :key="bottom.url"
        :style="BoardStyles.bottomPlayer" v-if="bottom && bottom.url && showPlayers">
        <div class="relative rounded-xl w-full h-full">
          <img class="absolute z-[10] rounded-2xl" :src="bottom.url" :style="playerImageStyle" />
          <!-- :style="{ 'background-image': `url(${bottom.url})` }" -->
          <img class="absolute z-[10] rotate-270 w-full h-full" src="/images/bottom-square.svg" />
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import gsap from "gsap";

const store = useMyBalootGameStore();
// Don't destructure reactive refs - keep them as refs to maintain reactivity
const snapshot = storeToRefs(store).snapshot;
const last_sakka = storeToRefs(store).last_sakka;
const usGameScore = storeToRefs(store).usGameScore;
const themGameScore = storeToRefs(store).themGameScore;
const BoardStyles = storeToRefs(store).BoardStyles;
const usName = storeToRefs(store).usName;
const themName = storeToRefs(store).themName;
const gameState = storeToRefs(store).gameState;
const left = storeToRefs(store).left;
const right = storeToRefs(store).right;
const bottom = storeToRefs(store).bottom;
const { gameService } = store;

const svgQydha = ref();
const { sleep } = useSleep();
const route = useRoute();

let showPlayers = route.query.showPlayers?.toString() ?? "false";
showPlayers = JSON.parse(showPlayers);




const playerImageStyle = computed(() => {
  return {
    width: "90%",
    height: "90%",
    left: "5%",
    top: "5%",
  }
})



const team1wrapper = ref(null);
const team2wrapper = ref(null);

const tweenedScores = reactive({
  team1: 0,
  team2: 0,
});

const mainScoreMount = (score1: number, score2: number) => {

  const t1 = gsap.timeline();

  t1.to(
    tweenedScores,
    {
      team1: score1,
      team2: score2,
      duration: 0.75,
    },
  );
};



const scoreMount = (score1: number, score2: number,) => {

  const t1 = gsap.timeline();
  t1.delay(2);
  t1.fromTo(
    [team1wrapper.value, team2wrapper.value],
    { opacity: 0 },
    {
      duration: 1,
      opacity: 1,
      ease: "linear",
    }
  ).to(
    tweenedScores,
    {
      team1: score1,
      team2: score2,
      duration: 0.75,
    },
    "<"
  );
};



const scoreUnMount = () => {
  const t2 = gsap.timeline();
  t2.to([team1wrapper.value, team2wrapper.value], {
    duration: 0.3,
    opacity: 0,
    ease: "linear",
  }).to(
    ".playerImage",
    {
      duration: 0.3,
      opacity: 0,
      ease: "linear",
    },
    "<"
  );
};


onMounted(() => {
  // Debug: Watch BoardStyles changes
  
  watchEffect(async () => {
    if (snapshot.value.matches("score.intro")) {
      if (svgQydha.value) {
        svgQydha.value.enteranimation();
      }

      scoreMount(
        last_sakka.value?.themSakkaScore ?? 0,
        last_sakka.value?.usSakkaScore ?? 0,
      );
      gameService.send({ type: "NEXT" });
    }
    if (snapshot.value.matches("score.main")) {
      mainScoreMount(
        last_sakka.value?.themSakkaScore!,
        last_sakka.value?.usSakkaScore!
      );
    }

    if (snapshot.value.matches("score.outro")) {
      if (svgQydha.value) {
        scoreUnMount();
        svgQydha.value!.outAnimation();
        await sleep(1250);
        gameService.send({ type: "NEXT" });
      }
    }
  });
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

* {
  font-family: "arefBold";
}
</style>
