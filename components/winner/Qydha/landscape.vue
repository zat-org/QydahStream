<template>
  <div class="winner-comp  w-[1920px] h-[1080px]" ref="winnerComp">
    <div  class="absolute h-[1080px] w-[1920px] flex justify-center  items-center top-[160px]  z-[10] " id="winner-data" ref="winnerData">
      <p id="winner-name">
        {{ winner!.name }}
      </p>
    </div>
    <div class="absolute h-[1080px] w-[1920px] flex justify-center gap-5 items-center">
      <div class=" relative ">
        <div class=" absolute  w-[178px] h-[200px]  left-[34px] top-[-80px] rotate-[15deg] z-[-2]  ">
          <img
               class="h-[250px]"
            :src=" winner!.players && winner!.players[0].url   ?winner!.players[0].url  : '/images/u1.jpg'"
            ref="winnerImages"   
            />
  
  
        </div>
        <div class="absolute  w-[185px] h-[400px] left-[-190px]  top-[-80px] rotate-[-15deg]  z-[-2] ">
          <img
          class="h-[250px]"
            :src=" winner!.players && winner!.players[1].url  ?winner!.players[1].url  : '/images/u2.jpg'"
            ref="winnerImages"
          />

        </div> 
      </div>
    </div>
   
    <video
      ref="mediaElm"
      class="video-elm"
      muted
      src="/videos/qydha/landscape/Winner.webm"
      height="1080"
      width="1920"></video>
  </div>
</template>

<script lang="ts" setup>



const store = useMyGameStore();
import gsap from "gsap";
const { snapshot, game } = storeToRefs(store);
const { gameService } = store;
const mediaElm = ref<HTMLVideoElement>();

const intro_start_sec = 0;
const intro_end_sec = 6;
const score_sec = intro_end_sec;
const outro_start = score_sec;
const winnerData = ref(null);
const winnerImages = ref(null);
const winnerComp = ref(null);

const scoreMount = () => {
  const t1 = gsap.timeline();
  t1.delay(1)
  t1.fromTo([winnerData.value, winnerImages.value],{opacity:0}, {
    duration: 0.75,
    opacity: 1,
    ease: "linear",
  });
};

const scoreUnMount = () => {
  const t2 = gsap.timeline();
  t2.to([winnerComp.value], {
    duration: 3,
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
    } else {
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
        mediaElm.value.currentTime = score_sec;
        await sleep(1000);
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
  @apply relative z-[-1] left-0 top-0;
}
#winner-data {
  @apply absolute text-4xl opacity-0 ;
  font-family: "arefBold";
}
#winner-data p {
  @apply  text-start bg-[linear-gradient(_to_right,#462523_0,#cb9b51_22%,#f6e27a_45%,#f6f2c0_50%,#f6e27a_55%,#cb9b51_78%,#462523_100%_)] text-transparent bg-clip-text m-0 p-0; 
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
