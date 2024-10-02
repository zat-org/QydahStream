<template>
  <div class="flex justify-center min-w-[325px] bg-transparent">
    <div class="relative w-[300px] h-[100px] z-[-5]">
      
      <QydhaSvg ref="svgQydha" class="absolute top-0 left-0 " />
          <!-- <div class="absolute top-[65px] left-[6px] w-[287px] bg-gray-500/55 flex justify-around items-center  ">
      <p class=" text-center w-[116px]">team2</p>
      <p class="w-[50px] text-center "> 999</p>
      <p class="w-[50px] text-center " > 999</p>
      <p class=" text-center w-[110px]" > team1</p>
          -->
      <div
        class="absolute text-center text-white flex h-[28px] top-[63px]   -translate-x-1/2 left-1/2 w-[280px]">
        <div class="w-1/2 flex items-center" ref="team2wrapper">
          <p class="grow mt-[-5px]" :key="game?.themName">
            {{
              game?.themName
                ? game?.themName
                : game?.themPlayers.length == 0
                ? "لهم"
                : game?.themPlayers[0].name +
                  "  |   " +
                  game?.themPlayers[1].name
            }}
          </p>
          <p class="w-[38px] mr-[5px] score">
            {{
              !sakka_ended ? last_sakka?.themSakkaScore : game?.themGameScore
            }}
          </p>
        </div>
        <div class="w-1/2 flex items-center" ref="team1wrapper">
          <p class="w-[38px] ml-[4px] score">
            {{ !sakka_ended ? last_sakka?.usSakkaScore : game?.usGameScore }}
          </p>
          <transition name="fade" mode="out-in">
            <p class="grow mt-[-5px]" key="game?.usName">
              {{
                game?.usName
                  ? game?.usName
                  : game?.usPlayers.length == 0
                  ? "لنا"
                  : game?.usPlayers[0].name + "  |   " + game?.usPlayers[1].name
              }}
            </p>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute();
const platform = ((route.query.platform as string)??'android').toLowerCase()
const store = useMyGameStore();
import gsap from "gsap";
const svgQydha =ref()
const { snapshot, game, sakka_ended } = storeToRefs(store);

const { gameService } = store;
const mediaElm = ref<HTMLVideoElement>();

const intro_start_sec = 0;
const intro_end_sec = 3;
const score_sec = 4;
const outro_start = score_sec;

const team1wrapper = ref(null);
const team2wrapper = ref(null);

const videoSrc = ref('/videos/qydha/portrait/Corner_Score.webm');

const checkVideoSupport = () => {

  if (platform == "ios") {
    videoSrc.value = '/videos/qydha/portrait/Corner_ScoreIPhone.mov'; 
  }
  
};

const scoreMount = () => {
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
onMounted(async() => {

  watchEffect(() => {
    if (snapshot.value.matches("score.intro")) {
      if (svgQydha.value) {
        svgQydha.value.enteranimation()
        scoreMount();
        gameService.send({ type: "NEXT" });
        
      }
    }
    if (snapshot.value.matches("score.main")) {
      
    }

    if (snapshot.value.matches("score.outro")) {
      if (mediaElm.value) {
        scoreUnMount();
        svgQydha.value!.outAnimation()
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
.fade-enter-from, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  @apply opacity-0;
}

.score {
  @apply text-slate-700  text-[1rem];
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
  @apply z-[-1];
}

* {
  font-family: "arefBold";
}
</style>
