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
            {{ gameState == "Ended" ? game!.themGameScore : tweenedScores.team1.toFixed(0) }}
          </p>
        </div>
        <!-- EMPTY SPACE -->
        <div class=" w-[2.5%] "></div>
        <!-- RIGHT TEAM  -->
        <div class="w-[50.5%] flex justify-between    items-center relative " ref="team1wrapper">

          <!-- RIGHT TEAM SCORE -->
          <p class=" score  w-[30%] mx-auto text-center  " :style="BoardStyles.scorePanel.rightTeam.score">
            {{ gameState == "Ended" ? game!.usGameScore : tweenedScores.team2.toFixed(0)}}
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
const route = useRoute();
let showPlayers = route.query.showPlayers?.toString() ?? "false";
showPlayers = JSON.parse(showPlayers);

import type { BalootStore, HandStore } from "~/composables/DetectBoard";
const { store } = DetectBoard();

const svgQydha = ref();
const { sleep } = useSleep();
import gsap from "gsap";
import type { SakkaI } from "~/models/game";
const { snapshot, game, boardSettings, } =
  storeToRefs(store.value as BalootStore | HandStore);
const portraitBoardSettings = computed(() => {
  return boardSettings.value?.portrait;
});

const themName = computed(() => {
  return game.value?.themName
    ? game.value?.themName
    : game.value?.themPlayers.length == 0
      ? "لهم"
      : game.value?.themPlayers[0].name +
      " | " +
      game.value?.themPlayers[1].name
})


const usName = computed(() => {
  return game.value?.usName
    ? game.value?.usName
    : game.value?.usPlayers.length == 0
      ? "لنا"
      : game.value?.usPlayers[0].name + " | " + game.value?.usPlayers[1].name

})

const playerImageStyle = computed(() => {
  return {
    width: "90%",
    height: "90%",
    left: "5%",
    top: "5%",
  }
})

const BoardStyles = computed(() => {
  return {
    dimension: {
      height: '1920px',
      width: '1080px',
    },
    scorePanel: {
      "margin-top": "0px",
      height: "295px",
      scale: .9,
      leftTeam: {
        name: {
          transform: `translate(0px,0px)`,
          'font-size': "30px",
        },
        score: {
          transform: `translate(0px,0px)`,
          'font-size': "50px",
        },
      },
      rightTeam: {
        name: {
          transform: `translate(0px,0px)`,
          'font-size': "30px",
        },
        score: {
          transform: `translate(0px,0px)`,
          'font-size': "50px",
        },
      }
    },
    leftPlayer: {
      top: "calc(50% - 100px)",
      left: "0px",
      height: "200px",
      width: "200px",
    },
    rightPlayer: {
      top: "calc(50% - 100px)",
      right: "0px",
      height: "200px",
      width: "200px",
    },
    bottomPlayer: {
      left: "calc(50% - 100px)",
      bottom: "0px",
      height: "200px",
      width: "200px",
    }
  }

  return {
    dimension: {
      height: portraitBoardSettings.value?.dimension.height + 'px',
      width: portraitBoardSettings.value?.dimension.width + 'px',
    },
    scorePanel: {
      'margin-top': portraitBoardSettings.value?.scorePanel.topMargin + "px",
      height: portraitBoardSettings.value?.scorePanel.height + "px",
      scale: portraitBoardSettings.value?.scorePanel.position.scale,
      leftTeam: {
        name: {
          transform: `translate(${portraitBoardSettings.value?.scorePanel.leftTeam.name.left}px, ${portraitBoardSettings.value?.scorePanel.leftTeam.name.top}px)`,
          'font-size': portraitBoardSettings.value?.scorePanel.leftTeam.name.size + "px",
        },
        score: {
          transform: `translate(${portraitBoardSettings.value?.scorePanel.leftTeam.score.left}px,${portraitBoardSettings.value?.scorePanel.leftTeam.score.top}px)`,
          'font-size': portraitBoardSettings.value?.scorePanel.leftTeam.score.size + "px",
        }
      },
      rightTeam: {
        name: {
          transform: `translate(${portraitBoardSettings.value?.scorePanel.rightTeam.name.left}px, ${portraitBoardSettings.value?.scorePanel.rightTeam.name.top}px)`,
          'font-size': portraitBoardSettings.value?.scorePanel.rightTeam.name.size + "px",
        },
        score: {
          transform: `translate(${portraitBoardSettings.value?.scorePanel.rightTeam.score.left}px,${portraitBoardSettings.value?.scorePanel.rightTeam.score.top}px)`,
          'font-size': portraitBoardSettings.value?.scorePanel.rightTeam.score.size + "px",
        }
      }
    },
    leftPlayer: {
      top: `calc(50% - ${(portraitBoardSettings.value?.playerImageWidth ?? 200) / 2}px ) + ${portraitBoardSettings.value?.leftPlayer.top}px`,
      left: `${portraitBoardSettings.value?.leftPlayer.left}px`,
      height: `${portraitBoardSettings.value?.playerImageWidth}px`,
      width: `${portraitBoardSettings.value?.playerImageWidth}px`,
    },
    rightPlayer: {
      top: `calc(50% - ${(portraitBoardSettings.value?.playerImageWidth ?? 200) / 2}px ) + ${portraitBoardSettings.value?.rightPlayer.top}px`,
      right: `${portraitBoardSettings.value?.rightPlayer.right}px`,
      height: `${portraitBoardSettings.value?.playerImageWidth}px`,
      width: `${portraitBoardSettings.value?.playerImageWidth}px`,
    },
    bottomPlayer: {
      left: `calc(50% - ${(portraitBoardSettings.value?.playerImageWidth ?? 200) / 2}px ) + ${portraitBoardSettings.value?.bottomPlayer.left}px`,
      bottom: `${portraitBoardSettings.value?.bottomPlayer.bottom}px`,
      height: `${portraitBoardSettings.value?.playerImageWidth}px`,
      width: `${portraitBoardSettings.value?.playerImageWidth}px`,

    }
  }

})

const { gameService } = store.value as BalootStore | HandStore;
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



const scoreMount = (score1: number, score2: number, ) => {

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

const last_sakka = ref<SakkaI>()
const gameState = ref()

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
  watchEffect(async () => {
    gameState.value = game.value?.state;
    last_sakka.value = game.value?.sakkas?.[game.value.sakkas.length - 1];

    if (snapshot.value.matches("score.intro")) {
      
      if (svgQydha.value) {
        svgQydha.value.enteranimation();        
      }
      
      scoreMount(
        last_sakka.value?.themSakkaScore ?? 0,
        last_sakka.value?.usSakkaScore ?? 0,

      );
      gameService.send({type: "NEXT"});
    }
    if (snapshot.value.matches("score.main")) {
      mainScoreMount(
        last_sakka.value?.themSakkaScore! ,
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

const bottom = computed(() => {
  if (game.value?.themPlayers.length! > 0) {
    return game.value?.usPlayers[1];
  } else {
    return null;
  }
});

const left = computed(() => {
  if (game.value?.themPlayers.length! > 0) {
    return game.value?.themPlayers[1];
  } else {
    return null;
  }
});

const right = computed(() => {
  if (game.value?.themPlayers.length! > 0) {
    return game.value?.themPlayers[0];
  } else {
    return null;
  }
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
