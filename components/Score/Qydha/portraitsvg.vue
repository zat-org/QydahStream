<template>
  <div
    class="flex justify-center aspect-[9/16] w-[95%] relative mx-auto duration-300 transition-all"
    :style="{ 'margin-top': tableData.scoreMarginTop }"
  >
    <div
      class="relative w-[300px] h-[100px] origin-center top-[0px] mx-auto transition-all duration-300"
    >
      <QydhaSvg ref="svgQydha" class="absolute top-0 left-0" />
      <div
        class="absolute text-center text-white flex h-[28px] top-[63px] -translate-x-1/2 left-1/2 w-[280px]"
      >
        <div class="w-1/2 flex items-center" ref="team2wrapper">
          <transition name="fade" mode="out-in">
            <p
              class="grow mt-[-5px]"
              :key="game?.themName"
              style="
                user-select: none;
                white-space: nowrap;
                letter-spacing: -0.5px;
                word-spacing: -1px;
              "
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
          <p class="w-[38px] mr-[5px] score">
            <!-- {{ newGameFlag ? "0" : tweenedScores.team2.toFixed(0) }} -->
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
        <div class="w-1/2 flex items-center" ref="team1wrapper">
          <p class="w-[38px] ml-[4px] score">
            <!-- {{ newGameFlag ? "0" : tweenedScores.team1.toFixed(0) }} -->
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
              class="grow mt-[-5px]"
              :key="game?.usName"
              style="
                user-select: none;
                white-space: nowrap;
                letter-spacing: -0.5px;
                word-spacing: -1px;
              "
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
          top: tableData.RightPlayer.top,
          left: tableData.LeftPlayer.left,
          height: tableData.PlayerImageWidth + 'px',
          width: tableData.PlayerImageWidth + 'px',
        }"
        v-if="left && left.url && showPlayers"
      >
        <div class="relative w-full h-full">
          <img
            class="absolute z-[10] bg-center bg-cover rounded-2xl w-[97%] h-[97%] top-[1px] left-[1px]"
            :style="{ 'background-image': `url(${left.url}) ` }"
          />
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
          top: tableData.RightPlayer.top,
          right: tableData.RightPlayer.right,
          height: tableData.PlayerImageWidth + 'px',
          width: tableData.PlayerImageWidth + 'px',
        }"
        v-if="right && right.url && showPlayers"
      >
        <div class="relative w-full h-full">
          <img
            class="absolute z-[10] bg-center bg-cover rounded-2xl w-[97%] h-[97%] top-[1px] left-[1px]"
            :style="{ 'background-image': `url(${right.url}) ` }"
          />
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
          left: tableData.BottomPlayer.left,
          bottom: tableData.BottomPlayer.bottom,
          height: tableData.PlayerImageWidth + 'px',
          width: tableData.PlayerImageWidth + 'px',
        }"
        v-if="bottom && bottom.url && showPlayers"
      >
        <div class="relative rounded-xl w-full h-full">
          <img
            class="absolute z-[10] bg-center bg-cover rounded-2xl w-[97%] h-[97%] top-[1px] left-[1px]"
            :style="{ 'background-image': `url(${bottom.url})` }"
          />
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

const table_id = route.params.id as string;
const { tableData, getOrCreateTable } = await useTable();
await getOrCreateTable(table_id);

watch(tableData.value, () => {
  console.log("Table data updated:", tableData.value);
  console.log();
});

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
  @apply text-slate-700 text-[1rem];
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
