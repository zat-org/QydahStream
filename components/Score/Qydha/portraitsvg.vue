<template>
  <div
    class="flex justify-center h-[1920px] w-[1080px]  relative mx-auto duration-300 transition-all"
    :style="{
      height: board?.dimension.height ?? '1920px',
      width: board?.dimension.width ?? '1080px',
    }"
  >
    <div
      class="relative w-full h-[300px] origin-center top-[0px] transition-all duration-300"
      :style="{
        'margin-top': board?.scorePanel.topMargin ?? '0px',
        width: board?.scorePanel.width ?? '100%' ,
        height: board?.scorePanel.height ?? '300px',
        scale : board?.scorePanel.position.scale  
      }"
    >
      <QydhaSvg ref="svgQydha" class="absolute top-0 left-0"  />
      <div
        class="absolute  text-white flex w-full h-[118px]  top-[66.3%]"
      >
        <div class="w-[52.5%] flex justify-between   items-center relative " ref="team2wrapper">
          <transition name="fade" mode="out-in">

            <p
              class="   w-[70%] mx-auto text-center   "
              :key="game?.themName"
              style="
                user-select: none;
                white-space: nowrap;
                letter-spacing: -0.5px;
                word-spacing: -1px;
              "
              :style="{
                 transform: `translate(${board?.scorePanel.leftTeam.name.left}, ${board?.scorePanel.leftTeam.name.top})`,
                'font-size':board?.scorePanel.leftTeam.name.size,
                }"
            >
              {{
                game?.themName
                  ? game?.themName
                  : game?.themPlayers.length == 0
                  ? "لهم"
                  : game?.themPlayers[0].name +
                    " | " +
                    game?.themPlayers[1].name
              }}
            </p>
          </transition>
          <p class="  score  w-[30%] mx-auto text-center  "
          :style="{
                transform: `translate(${board?.scorePanel.leftTeam.score.left}, ${board?.scorePanel.leftTeam.score.top})`,
                'font-size':board?.scorePanel.leftTeam.score.size,
                }"
          >

            {{
              newGameFlag
                ? 0
                : sakka_ended
                ? game?.themGameScore
                : // : newGameFlag
                  // ? "0"
                  tweenedScores.team2.toFixed(0)
            }}
          </p>
        </div>
        <div class=" w-[2.5%] "></div>
        <div class="   w-[50.5%] flex justify-between    items-center relative " ref="team1wrapper">
          <p class=" score  w-[30%] mx-auto text-center  "
          :style="{
                transform: `translate(${board?.scorePanel.rightTeam.score.left}, ${board?.scorePanel.rightTeam.score.top})`,
                'font-size':board?.scorePanel.rightTeam.score.size,
                
                }"
          >

            {{
              newGameFlag
                ? 0
                : sakka_ended
                ? game?.usGameScore
                : // : newGameFlag
                  // ? "0"
                  tweenedScores.team1.toFixed(0)
            }}
          </p>
          <transition name="fade" mode="out-in">
            <p
              class="   w-[70%] mx-auto text-center    "
              :key="game?.usName"
              style="
                user-select: none;
                white-space: nowrap;
                letter-spacing: -0.5px;
                word-spacing: -1px;
              "
              :style="{
               
                transform: `translate(${board?.scorePanel.rightTeam.name.left}, ${board?.scorePanel.rightTeam.name.top})`,
                'font-size':board?.scorePanel.rightTeam.name.size,
               
                }"
            >
              {{
                game?.usName
                  ? game?.usName
                  : game?.usPlayers.length == 0
                  ? "لنا"
                  : game?.usPlayers[0].name + " | " + game?.usPlayers[1].name
              }}
            </p>
          </transition>
        </div>
      </div>
    </div>
    <transition name="fade" mode="out-in">
      <div
        class="absolute playerImage transition-all duration-300"
        :key="left.url"
        :style="{
          top: LeftPlayerTop,
          left: board?.LeftPlayer.left,
          height: board?.PlayerImageWidth + 'px',
          width: board?.PlayerImageWidth + 'px',
        }"
        v-if="left && left.url && showPlayers"
      >
        <div class="relative w-full h-full">
          <img
            class="absolute z-[10] rounded-2xl"
            :src="left.url"
            style="width: 90%; height: 90%; left: 5%; top: 5%"
          />
          <!-- :style="{ 'background-image': `url(${left.url}) ` }" -->
          <img
            class="absolute z-[10] w-full h-full"
            src="/images/left-square.svg"
          />
        </div>
      </div>
    </transition>
    <transition name="fade" mode="out-in">
      <div
        class="absolute origin-center playerImage transition-all duration-300"
        :key="right.url"
        :style="{
          top: RightPlayerTop,
          right: board?.RightPlayer.right,
          height: board?.PlayerImageWidth + 'px',
          width: board?.PlayerImageWidth + 'px',
        }"
        v-if="right && right.url && showPlayers"
      >

      
        <div class="relative w-full h-full">
          <img
            class="absolute z-[10] rounded-2xl"
            :src="right.url"
            style="width: 90%; height: 90%; left: 5%; top: 5%"
          />
          <!-- :style="{ 'background-image': `url(${right.url}) ` }" -->
          <img
            class="absolute z-[10] rotate-180 w-full h-full"
            src="/images/right-square.svg"
          />
        </div>
      </div>
    </transition>
    <transition name="fade" mode="out-in">
      <div
        class="absolute origin-center playerImage transition-all duration-300"
        :key="bottom.url"
        :style="{
          left: BottomPlayerLeft,
          bottom: board?.BottomPlayer.bottom,
          height: board?.PlayerImageWidth + 'px',
          width: board?.PlayerImageWidth + 'px',
        }"
        v-if="bottom && bottom.url && showPlayers"
      >
        <div class="relative rounded-xl w-full h-full">
          <img
            class="absolute z-[10] rounded-2xl"
            :src="bottom.url"
            style="width: 90%; height: 90%; left: 5%; top: 5%"
          />
          <!-- :style="{ 'background-image': `url(${bottom.url})` }" -->
          <img
            class="absolute z-[10] rotate-270 w-full h-full"
            src="/images/bottom-square.svg"
          />
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute();
let showPlayers = route.query.showPlayers?.toString() ?? "false";
showPlayers = JSON.parse(showPlayers);

const { board } = storeToRefs(useMyBoardConfStore());

const store = useMyGameStore();
const svgQydha = ref();
const { sleep } = useSleep();
import gsap from "gsap";
import { useTable } from "~/composables/Table";
const { snapshot, game, sakka_ended, newGameFlag, game_updated } =
  storeToRefs(store);

const { gameService } = store;
const team1wrapper = ref(null);
const team2wrapper = ref(null);

const tweenedScores = reactive({
  team1: 0,
  team2: 0,
});
const scoreMount = (score1: number, score2: number) => {
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
const last_sakka = computed(() => {
  return game.value?.sakkas?.[game.value.sakkas.length - 1] ?? undefined;
});

watch(newGameFlag, (new_value, old_value) => {
  if (new_value == true) {
    tweenedScores.team1 = 0;
    tweenedScores.team2 = 0;
  }
});

watch(game_updated, (new_value, old_value) => {
  console.log(game_updated.value);
  if (game_updated.value == true) {
    tweenedScores.team1 = last_sakka.value!.usSakkaScore!;
    tweenedScores.team2 = last_sakka.value!.themSakkaScore!;
    game_updated.value = false;
  }
});

console.log(game);
onMounted(() => {
  watchEffect(async () => {
    if (snapshot.value.matches("score.intro")) {
      if (svgQydha.value) {
        svgQydha.value.enteranimation();
        scoreMount(
          last_sakka.value!.usSakkaScore!,
          last_sakka.value!.themSakkaScore!
        );
        gameService.send({ type: "NEXT" });
      }
    }
    if (snapshot.value.matches("score.main")) {
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

const top = computed(() => {
  if (game.value?.themPlayers.length! > 0) {
    return game.value?.usPlayers[0];
  } else {
    return null;
  }
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
const RightPlayerTop =computed(()=>{
  return `calc(50% - ${board.value?.RightPlayer.top})`
})
const LeftPlayerTop =computed(()=>{
  return `calc(50% - ${board.value?.LeftPlayer.top})`
})
const BottomPlayerLeft =computed(()=>{
  return `calc(50% - ${board.value?.BottomPlayer.left})`
})
</script>
<style scoped>
.fade-enter-active,
.fade-leave-active {
  @apply transition-opacity duration-[1s] ease-[ease];
}

.fade-enter-from,
.fade-leave-to

/* .fade-leave-active in <2.1.8 */ {
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
