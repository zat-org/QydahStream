<template>
  <div class="winner-comp" ref="winnerComp">
    <div id="winner-data" ref="winnerData">
      <p id="winner-name">
        {{ winner!.name }}
      </p>
    </div>
    <div id="winner-images" ref="winnerImages">
      <div id="player1-img-wrapper" class="wrapper">
        <img
          :src=" winner!.players && winner!.players[0].url   ?winner!.players[0].url  : '/images/u1.jpg'"
          id="image1"
          class="image"
          :width="139"
          :height="194" />


      </div>
      <div id="player2-img-wrapper" class="wrapper">
        <img
          :src=" winner!.players && winner!.players[1].url  ?winner!.players[1].url  : '/images/u2.jpg'"
          id="image2"
          class="image"
          :width="139"
          :height="194" />


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

const route =useRoute()

const theme =ref()
const orientaion = ref()

theme.value =route.query.theme
orientaion.value =route.query.orienation  


const store = useMyGameStore();
import gsap from "gsap";
const { snapshot, game } = storeToRefs(store);
const { gameService } = store;
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
    console.log(game?.value?.winner)
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
    console.log(snapshot);
    if (snapshot.value.matches("winner.intro")) {
      if (mediaElm.value) {
        mediaElm.value.currentTime = intro_start_sec;
        scoreMount();
        mediaElm.value.play();
        mediaElm.value.ontimeupdate = () => {
          if (mediaElm.value && mediaElm.value?.currentTime! >= intro_end_sec) {
            mediaElm.value.ontimeupdate = null;
            mediaElm.value.currentTime = score_sec;
            mediaElm.value.pause();
            gameService.send({ type: "NEXT" });
          }
        };
      }
    }
    if (snapshot.value.matches("winner.main")) {
      if (mediaElm.value) {
        mediaElm.value.currentTime = score_sec;
        scoreUnMount();
        await sleep(500);
        gameService.send({ type: "UPDATE_CONTEXT",  ended:false });
        
        gameService.send({ type: "NEW_GAME" });
      }
    }
  });
});
</script>
<style scoped>
/*
  Based on TailwindCSS recommendations,
  consider using classes instead of the `@apply` directive
  @see https://tailwindcss.com/docs/reusing-styles#avoiding-premature-abstraction
*/
.winner-comp {
  @apply relative;
}
.video-elm {
  @apply relative z-[-1] left-0 top-0;
}
#winner-data {
  @apply absolute text-6xl opacity-0 left-[380px] top-[450px];
  font-family: "arefBold";
}
#winner-data p {
  @apply w-[500px] text-start bg-[linear-gradient(_to_right,#462523_0,#cb9b51_22%,#f6e27a_45%,#f6f2c0_50%,#f6e27a_55%,#cb9b51_78%,#462523_100%_)] text-transparent bg-clip-text m-0 p-0; 
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
#player1-img-wrapper {
  @apply left-0;
}
#player2-img-wrapper {
  @apply right-0;
}
.image {
  @apply absolute z-[-1] top-0;
}

</style>
