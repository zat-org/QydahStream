<template>
  <div class="winner-comp" ref="winnerComp">
    <div class="winner-data" ref="winnerData">
      <div
        class=" bg-black/10 p-3 rounded-xl w-[365px]  relative flex flex-col justify-center items-center gap-4 left-[-260px]">
        <p class="text-3xl self-end">الفريق الفائز</p>
        <p class="h-[100px] bg-gray-400" v-if="winner">
          {{ winner.name }}
        </p>
      </div>
    </div>
    <div class="absolute h-[1080px] w-[1920px] left-0 top-0" ref="winnerImages">
      <div
        class="relative flex justify-center items-center gap-1 w-full h-full  ">
        <div class="relative w-[140px] h-[195px] left-[293px]">
          <img
            class="w-[140px] h-[195px]  absolute z-[10]"
            :src="game!.winner=='Us'?'/images/zat/RedFrame.svg' :'/images/zat/BlackFrame.svg'" />
          <img
            :src=" winner!.players && winner!.players[0].url ? winner!.players[0].url  : '/images/u1.jpg'"
            class="w-[140px] h-[195px] absolute " />
        </div>
        <div class="relative w-[140px] h-[195px] left-[305px]">
          <img
            class="w-[140px] h-[195px]  absolute z-[10]"
            :src="game!.winner=='Us'?'/images/zat/RedFrame.svg' :'/images/zat/BlackFrame.svg'" />
          <img
            :src=" winner!.players && winner!.players[1].url  ?winner!.players[1].url  : '/images/u2.jpg'"
            class="w-[140px] h-[195px] absolute" />
        </div>
      </div>
    </div>
    <video
      ref="mediaElm"
      class="video-elm"
      muted
      src="/videos/zat/Winner.webm"
      height="1080"
      width="1920"></video>
  </div>
</template>

<script lang="ts" setup>

import type { BalootStore, HandStore } from "~/composables/DetectBoard";
const { store } = DetectBoard();
import gsap from "gsap";
const { snapshot, game } = storeToRefs(store.value as BalootStore | HandStore);
const { gameService } = store.value as BalootStore | HandStore;
const mediaElm = ref<HTMLVideoElement>();

const intro_start_sec = 0;
const intro_end_sec = 5;
const score_sec = intro_end_sec;
const outro_start = score_sec;
const winnerData = ref(null);
const winnerImages = ref(null);
const winnerComp = ref(null);

const scoreMount = () => {
  const t1 = gsap.timeline();
  t1.to([winnerData.value, winnerImages.value], {
    duration: 0.75,
    opacity: 1,
    ease: "bounce.out",
  });
};

const scoreUnMount = () => {
  const t2 = gsap.timeline();
  t2.to([winnerComp.value], {
    duration: 1,
    opacity: 0,
    ease: "bounce.out",
  });
};

const { sleep } = useSleep();
const winner = computed(() => {
  if (game?.value?.winner) {
    if (game.value.winner == "Us") {

      return {
        players: game.value.usPlayers.length > 0 ? game.value.usPlayers : null,
        name: game.value.usName,
      };
    } else {

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
    if (snapshot.value.matches("winner.intro")) {
      if (mediaElm.value) {
        mediaElm.value.currentTime = intro_start_sec;
        scoreMount();
        mediaElm.value.play();
        await sleep(intro_end_sec*1000)
        mediaElm.value.currentTime = score_sec;
        mediaElm.value.pause();
        gameService.send({ type: "NEXT" });

      }
    }
    if (snapshot.value.matches("winner.main")) {
      if (mediaElm.value) {
        scoreUnMount();
        gameService.send({ type: "UPDATE_CONTEXT", ended: false });
        gameService.send({ type: "NEW_GAME" });
      }
    }
  });
});
</script>
<style scoped>

.winner-comp {
  @apply relative;
}
.video-elm {
  @apply relative  left-0 top-0;
}
.winner-data {
  @apply w-[1920px] h-[1080px]  absolute flex justify-center items-center text-6xl opacity-0 top-0 left-0;
  font-family: "arefBold";
}
.winner-data p {
  @apply bg-[linear-gradient(_to_right,#462523_0,#cb9b51_22%,#f6e27a_45%,#f6f2c0_50%,#f6e27a_55%,#cb9b51_78%,#462523_100%_)] text-transparent bg-clip-text m-0 p-0;
  /* background-color: aqua; */
  -webkit-background-clip: text;
}
</style>
