<template>
  <div>
    <video ref="mediaElm" class="video" muted height="1080" width="1920" :src="'/videos/zat/Corner_Score.webm'"></video>
    <div class="left-[976px] teamWrap" ref="team1wrapper">
      <img :src="'/images/zat/zat_white.svg'" class="SponsorImage left-[254px]" />
      <transition name="fade" mode="out-in">
        <p :key="game?.usName" class="left-14 teamName">
          {{
            game?.usName
              ? game?.usName
              : game?.usPlayers.length == 0
                ? "لنا"
                : game?.usPlayers[0].name + " | " + game?.usPlayers[1].name
          }}
        </p>
      </transition>
      <p class="left-[0px] score">
        {{ newGameFlag ? "0" : tweenedScores.team1.toFixed(0) }}
        <!-- {{ !sakka_ended ? last_sakka?.usSakkaScore : game?.usGameScore }} -->
      </p>
    </div>

    <div class="left-[621px] teamWrap" ref="team2wrapper">
      <p class="left-[269px] score">
        <!-- {{ !sakka_ended ? last_sakka?.themSakkaScore : game?.themGameScore }} -->
        {{ newGameFlag ? "0" : tweenedScores.team2.toFixed(0) }}
      </p>
      <transition name="fade" mode="out-in">
        <p :key="game?.themName" class="teamName left-[82px]">
          {{
            game?.themName
              ? game?.themName
              : game?.themPlayers.length == 0
                ? "لهم"
                : game?.themPlayers[0].name + " | " + game?.themPlayers[1].name
          }}
        </p>
      </transition>
      <img :src="'/images/zat/zat_black.svg'" class="SponsorImage left-[3px]" />
    </div>
  </div>

</template>

<script lang="ts" setup>


import gsap from "gsap";


const store = useMyGameStore();
const { snapshot, game, sakka_ended, newGameFlag, game_updated } =
  storeToRefs(store);
const { gameService } = store;

const mediaElm = ref<HTMLVideoElement>();
const { sleep } = useSleep();
const intro_start_sec = 0;
const intro_end_sec = 3.5;
const score_sec = intro_end_sec;
const outro_start = score_sec;

const team1wrapper = ref(null);
const team2wrapper = ref(null);

const tweenedScores = reactive({
  team1: 0,
  team2: 0,
});

const scoreMount = (score1: number, score2: number) => {
  const t1 = gsap.timeline();
  t1.delay(2.15);
  t1.fromTo(
    [team1wrapper.value, team2wrapper.value],
    { opacity: 0 },
    {
      duration: 0.5,
      opacity: 1,
      ease: "linear",
    }
  ).to(tweenedScores, {
    team1: score1,
    team2: score2,
    duration: 0.75,
  });
};

const scoreUnMount = () => {
  const t2 = gsap.timeline();
  t2.to([team1wrapper.value, team2wrapper.value], {
    duration: 0.3,
    opacity: 0,
    ease: "linear",
  });
};
let last_sakka = computed(() => {
  console.log(game.value)
  return game.value?.sakkas?.[game.value.sakkas.length - 1] ?? undefined;

})

watch(newGameFlag, (new_value, old_value) => {
  if (new_value == true) {
    tweenedScores.team1 = 0;
    tweenedScores.team2 = 0;
  }
});

watch(game_updated, (new_value, old_value) => {
  console.log(game_updated.value)
  if (game_updated.value == true) {
    tweenedScores.team1 =
      last_sakka.value!.usSakkaScore!;
    tweenedScores.team2 =
      last_sakka.value!.themSakkaScore!;
    game_updated.value = false;
  }
})


onMounted(async () => {
  watchEffect(async () => {
    if (snapshot.value.matches("score.intro")) {
      if (mediaElm.value) {
        mediaElm.value.currentTime = intro_start_sec;
        mediaElm.value.play();

        scoreMount(last_sakka.value!.usSakkaScore!, last_sakka.value!.themSakkaScore!);
        await sleep(intro_end_sec * 1000);
        mediaElm.value.pause();
        mediaElm.value.currentTime = score_sec;
        gameService.send({ type: "NEXT" });
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
        mediaElm.value.playbackRate = 2;
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

.fade-enter-from,
.fade-leave-to

/* .fade-leave-active in <2.1.8 */
  {
  @apply opacity-0;
}

.score {
  @apply absolute text-[1.6rem] w-[55px] h-[55px] flex justify-center items-center top-0;
  font-family: "CairoSemiBold";
}

.teamName {
  @apply absolute w-[185px] text-[1.75rem] h-[40px] flex justify-center items-center top-1.5;
}

.teamWrap {
  @apply text-[white] text-center w-[324px] h-[62px] absolute opacity-100 top-[20px];
}

.video {
  @apply relative top-0 left-0 z-[-1];
}

.wrapcomp {
  @apply relative h-screen w-screen;
}

.SponsorImage {
  @apply absolute w-[71px] h-[65px] -top-[5px] box-border overflow-hidden;
}

* {
  font-family: "arefBold";
}
</style>
