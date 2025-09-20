<template>
  <div
    class="flex justify-center relative mx-auto"
    :style="BoardStyles.dimension"
  >
    <div
      class="relative  w-full origin-center top-[0px]"
      :style="BoardStyles.scorePanel"
    >
      <QydhaSvg ref="svgQydha" class="absolute top-0 left-0" />

      <div class="absolute text-center text-white flex w-full bottom-[0px]">
        <div class="w-[52.5%] flex  justify-between items-center relative" ref="team2wrapper">
          <transition name="fade" mode="out-in">
            <p
              class="w-[70%] text-center "
              :key="game?.themName"
              :style="BoardStyles.scorePanel.leftTeam.name"
            >
              {{themName}}
            </p>
          </transition>
          <p
            class="score w-[30%] mx-auto text-center"
            :style="BoardStyles.scorePanel.leftTeam.score"
          >
            {{ last_sakka?.themSakkaScore }}
          </p>
        </div>
        <div class=" w-[2.5%] "></div>
        <div class="w-[50.5%] flex justify-between items-center relative" ref="team1wrapper">
          <p
            class="score w-[30%] text-center mx-auto"
            :style="BoardStyles.scorePanel.rightTeam.score"
          >
            {{ last_sakka?.usSakkaScore }}
          </p>
          <transition name="fade" mode="out-in">
            <p
              class=" w-[70%] mx-auto text-center"
              :key="game?.usName"
              :style="BoardStyles.scorePanel.rightTeam.name"
            >
              {{usName}}
            </p>
          </transition>
        </div>
      </div>
      <div
        class="absolute flex gap-5 w-full justify-center top-[350px]"
        ref="score"
      >
        <div class="TeamDetailedScore text-right grow">
          <p
            class="score"
            :style="BoardStyles.detailScore"
            v-for="e_m,index in ended_moshtras"
            :key="['themscore',index].toString()"

          >
            {{ e_m.themAbnat }}
          </p>
        </div>
        <div
          class="bg-gradient-to-b from-transparent via-orange-500 to-transparent w-[10px] h-[50vh] rounded-lg"
        ></div>
        <div class="TeamDetailedScore grow">
          <p
            class="score"
            :style="BoardStyles.detailScore"
            v-for="e_m,index in ended_moshtras"
            :key="['usscore',index].toString()"

          >
            {{ e_m.usAbnat }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const svgQydha = ref();

const { board } = storeToRefs(useMyBoardConfStore());
import type { BalootStore, HandStore } from "~/composables/DetectBoard";
const { store } = DetectBoard();
import gsap from "gsap";
import type { SakkaI } from "~/models/game";
const { sleep } = useSleep();
const { snapshot, game ,boardSettings} = storeToRefs(store.value as BalootStore | HandStore);
const { gameService } = store.value as BalootStore | HandStore;
const team1wrapper = ref(null);
const team2wrapper = ref(null);
const score = ref(null);


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
    },
    detailScore: {
      color: "#000000",
      "font-size": "70px",
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

    },
    detailScore: {
      color: portraitBoardSettings.value?.detailScore.color,
      "font-size": portraitBoardSettings.value?.detailScore.fontSize + "px",
    }
  }

})


const last_sakka_index = computed(() => {
  return game.value?.sakkas.length! - 1;
});
const last_sakka = computed<SakkaI | undefined>(() => {
  return game.value?.sakkas[last_sakka_index.value];
});

const ended_moshtras = computed(() => {
  return last_sakka.value?.moshtaras.filter((m) => {
    return m.state == "Ended";
  });
});
const scoreMount = () => {
  console.log("start score mount ");
  const t1 = gsap.timeline();
  t1.delay(2);
  t1.fromTo(
    [team1wrapper.value, team2wrapper.value, score.value],
    { opacity: 0 },
    {
      duration: 2,
      opacity: 1,
      ease: "linear",
    }
  );
};

const scoreUnMount = () => {
  const t2 = gsap.timeline();
  t2.to([team1wrapper.value, team2wrapper.value, score.value], {
    duration: 0.3,
    opacity: 0,
    ease: "linear",
  });
};

onMounted(() => {
  watchEffect(async () => {
    if (snapshot.value.matches("detail.intro")) {
      if (svgQydha.value) {
        svgQydha.value.enteranimation();
        scoreMount();
        await sleep(4000);

        gameService.send({ type: "NEXT" });
      }
    }
    if (snapshot.value.matches("detail.main")) {
      await sleep(4000);
      gameService.send({ type: "TO_OUTRO" });
    }

    if (snapshot.value.matches("detail.outro")) {
      if (svgQydha.value) {
        svgQydha.value.outAnimation();
        scoreUnMount();
        await sleep(2000);
        gameService.send({ type: "CHECK_END" });
      }
    }
  });
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
  @apply text-[white] text-center w-[499px] h-[97px] absolute opacity-0 top-[425px];
  font-family: "arefBold";
}

.TeamName {
  @apply absolute text-[2rem] h-[81px] flex justify-center items-center top-2 w-[300px];
}

.TeamScore {
  @apply absolute text-slate-700 text-[2.8rem] w-[100px] h-[97px] flex justify-center items-center top-0;
  font-family: "CairoSemiBold";
}

.TeamSponsor {
  @apply absolute w-[66px] h-[62px] top-[13px];
}

.TeamDetailedScore {
  @apply w-[25%] text-[2rem] text-gray-600 ;
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
