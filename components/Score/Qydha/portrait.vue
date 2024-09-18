<template>
  <div class="relative ">
    <video 
      ref="mediaElm"
      class=" absolute   top-0 left-0  "
   
      
      muted
      src="/videos/qydha/portrait/Corner_Score.webm">
    
    </video>

  <div class="right-[155px] teamWrap" ref="team1wrapper">
  <!-- <img
    :src="'/images/zat/zat_white.svg'"
    class=" SponsorImage left-64" /> -->
  <transition name="fade" mode="out-in">
    <p :key="game?.usName" class="left-[0] teamName">
      {{
        game?.usName
          ? game?.usName
          : game?.usPlayers.length == 0
          ? "لنا"
          : game?.usPlayers[0].name + "  |   " + game?.usPlayers[1].name
      }}
    </p>
  </transition>
  <p class="-left-[8px] score">
    {{ !sakka_ended ? last_sakka?.usSakkaScore : game?.usGameScore }}
  </p>
</div>

<div class="left-[80px] teamWrap " ref="team2wrapper">
  <p class="-right-[85px] score">
    {{ !sakka_ended ? last_sakka?.themSakkaScore : game?.themGameScore }}
  </p>
  <transition name="fade" mode="out-in">
    <p :key="game?.themName" class="teamName -left-[30px]">
      {{
        game?.themName
          ? game?.themName
          : game?.themPlayers.length == 0
          ? "لهم"
          : game?.themPlayers[0].name + "  |   " + game?.themPlayers[1].name
      }}
    </p>
  </transition>

  <!-- <img
    :src="'/images/zat/zat_black.svg'"
    class=" SponsorImage left-[5px] " /> -->
</div>
</div>
  
</template>

<script lang="ts" setup>
const route = useRoute();

console.log(window.innerWidth)
console.log(window.innerHeight)
const widthvideo = ref(window.innerWidth)
const store = useMyGameStore();
import gsap from "gsap";
const { snapshot, game, sakka_ended } = storeToRefs(store);

const { gameService } = store;
const mediaElm = ref<HTMLVideoElement>();

const intro_start_sec = 0;
const intro_end_sec = 4;
const score_sec = intro_end_sec;
const outro_start = score_sec;

const team1wrapper = ref(null);
const team2wrapper = ref(null);

const scoreMount = () => {
  const t1 = gsap.timeline();
  t1.delay(1.75);
  t1.fromTo(
    [team1wrapper.value, team2wrapper.value],
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
  t2.to([team1wrapper.value, team2wrapper.value], {
    duration: 0.8,
    opacity: 0,
    ease: "linear",
  });
};
const last_sakka = computed(() => {
  return game.value?.sakkas?.[game.value.sakkas.length - 1] ?? undefined;
});

console.log(game);
onMounted(() => {


  watchEffect(() => {
    if (snapshot.value.matches("score.intro")) {
      if (mediaElm.value) {
        mediaElm.value.currentTime = intro_start_sec;
        mediaElm.value.play();
        // scoreMount();
        mediaElm.value.ontimeupdate = () => {
          if (mediaElm.value && mediaElm.value?.currentTime! >= intro_end_sec) {
            mediaElm.value.ontimeupdate = null;
            mediaElm.value.pause();
            mediaElm.value.currentTime = score_sec;
            gameService.send({ type: "NEXT" });
          }
        };
      }
    }
    if (snapshot.value.matches("score.main")) {
      if (mediaElm.value) {
        mediaElm.value.currentTime = score_sec;
      }
    }

    if (snapshot.value.matches("score.outro")) {
      if (mediaElm.value) {
        mediaElm.value.currentTime = outro_start;
        mediaElm.value.play();
        scoreUnMount();
        mediaElm.value.onended = () => {
          // mediaElm.value.onended=null;
          gameService.send({ type: "NEXT" });
        };
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
.fade-enter-from, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  @apply opacity-0;
}

.score {
  @apply text-slate-700 absolute text-[1rem] w-[55px] h-[55px] flex justify-center items-center top-0;
  font-family: "CairoSemiBold";
}

.teamName {
  @apply absolute w-[85px]   text-[1rem] h-[40px] flex justify-end items-center top-1.5;
}

.teamWrap {
  @apply text-[white] text-center w-[50px] h-[62px] absolute opacity-100 top-[58px];
}


.SponsorImage {
  @apply absolute w-[66px] h-[62px] -top-0.5; 
} 

.video {
  @apply  z-[-1];
}



* {
  font-family: "arefBold";
}
</style>
