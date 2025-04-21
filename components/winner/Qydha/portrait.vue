<template>
  <div
    class="winner-comp h-[300] w-[400px] mt-[200px]"
    ref="winnerComp"
    style="
      width: 1080px;
      height: 1920px;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
    "
  >
    <div
      class="absolute flex justify-center items-center z-[10]"
      id="winner-data"
      ref="winnerData"
      style="opacity: 2; margin-top: 445px; font-size: 4rem; line-height: 6rem"
    >
      <p id="winner-name" v-if="winner">
        {{ winner.name }}
      </p>
    </div>
    <div
      class="absolute flex justify-center gap-5 items-center"
      style="width: 50%; height: 50%"
    >
      <div
        class="relative"
        style="
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        "
      >
        <div
          class="absolute rotate-[15deg] z-[-2]"
          style="
            margin-left: 324px;
            width: 246px;
            height: 306px;
            margin-top: 108px;
          "
        >
          <img
            :src=" winner!.players && winner!.players[0].url   ?winner!.players[0].url  : '/images/u1.jpg'"
            ref="image1"
            style="width: 100%; height: 100%"
          />
        </div>
        <div
          class="absolute rotate-[-15deg] z-[-2]"
          style="
            width: 243px;
            margin-right: 329px;
            height: 291px;
            margin-top: 100px;
          "
        >
          <img
            style="height: 100%; width: 100%"
            :src=" winner!.players && winner!.players[1].url  ?winner!.players[1].url  : '/images/u2.jpg'"
            ref="image2"
          />
        </div>
      </div>
    </div>

    <WinnerSvg ref="Winnersvg" />
  </div>
</template>

<script lang="ts" setup>
const store = useMyGameStore();
import gsap from "gsap";
const { snapshot, game } = storeToRefs(store);
const { gameService } = store;

const Winnersvg = ref();
const winnerData = ref(null);
const image2 = ref(null);
const image1 = ref(null);

const winnerComp = ref(null);

const scoreMount = () => {
  const t1 = gsap.timeline();
  t1.delay(1);
  t1.fromTo(
    [winnerData.value, image1.value, image2.value],
    { opacity: 0 },
    {
      duration: 0.75,
      opacity: 2,
      ease: "linear",
    }
  );
};

const scoreUnMount = () => {
  const t2 = gsap.timeline();
  t2.to([winnerComp.value], {
    duration: 1,
    opacity: 0,
    ease: "linear",
  });
};

const { sleep } = useSleep();
const winner = computed(() => {
  if (game?.value?.winner) {
    if (game.value.winner == "Us") {
      console.log(game.value.usPlayers);
      return {
        players: game.value.usPlayers.length > 0 ? game.value.usPlayers : null,
        name: game.value.usName,
      };
    } else if (game.value.winner == "Them") {
      console.log(game.value.themPlayers);
      return {
        players:
          game.value.themPlayers.length > 0 ? game.value.themPlayers : null,
        name: game.value.themName,
      };
    }
  }
});
onMounted(() => {
  watchEffect(async () => {
    console.log(snapshot);
    if (snapshot.value.matches("winner.intro")) {
      if (Winnersvg.value) {
        scoreMount();
        Winnersvg.value.enterAnimation();

        await sleep(2500);
        gameService.send({ type: "NEXT" });
      }
    }
    if (snapshot.value.matches("winner.main")) {
      if (Winnersvg.value) {
        Winnersvg.value.leaveAnimation();
        scoreUnMount();
        await sleep(1500);
        gameService.send({ type: "UPDATE_CONTEXT", ended: false });
        gameService.send({ type: "NEW_GAME" });
      }
    }
  });
});
</script>
<style scoped>
.winner-comp {
  @apply relative mx-auto mt-[50px];
}
.video-elm {
  @apply relative z-[-1] left-0 top-0;
}
#winner-data {
  @apply absolute text-4xl opacity-0;
  font-family: "arefBold";
}
#winner-data p {
  @apply text-start bg-[linear-gradient(_to_right,#462523_0,#cb9b51_22%,#f6e27a_45%,#f6f2c0_50%,#f6e27a_55%,#cb9b51_78%,#462523_100%_)] text-transparent bg-clip-text m-0 p-0;
  /* background-color: aqua; */
  -webkit-background-clip: text;
}
#winner-word {
  @apply text-[2.75rem];
}
#winner-images {
  @apply absolute w-[295px] h-[194px] opacity-0 rounded-[10px] left-[1113px] top-[443px];
  /* background-color: black; */
}
.wrapper {
  @apply absolute h-[194px] w-[139px] overflow-hidden rounded-[10px];
  /* background-color: rgba(0, 255, 255, 0.377); */
}
/* #player1-img-wrapper {
  @apply left-0 -rotate-[30deg];

} */
/* #player2-img-wrapper {
  @apply right-0;
} */
/* .image {
  @apply absolute z-[-1] top-0;
} */
</style>
