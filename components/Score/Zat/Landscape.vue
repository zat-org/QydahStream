<template>
  <div>
    <video
      ref="mediaElm"
      class="video"
      muted
      height="1080"
      width="1920"
      :src="'/videos/zat/Corner_Score.webm'"
    ></video>
    <div class="left-[976px] teamWrap" ref="team1wrapper">
      <img
        :src="'/images/zat/zat_white.svg'"
        class="SponsorImage left-[254px]"
      />
      <transition name="fade" mode="out-in">
        <p :key="usName" class="left-14 teamName">
          {{ usName  }}
        </p>
      </transition>
      <p class="left-[0px] score">
        {{
          
           gameState == "Ended" ? game?.usGameScore : tweenedScores.team1.toFixed(0)
        }}
      </p>
    </div>

    <div class="left-[621px] teamWrap" ref="team2wrapper">
      <p class="left-[269px] score">
        {{         
              gameState == "Ended" ? game?.themGameScore : tweenedScores.team2.toFixed(0)
        }}
      </p>
      <transition name="fade" mode="out-in">
        <p :key="themName" class="teamName left-[82px]">
          {{ themName }}
          
        </p>
      </transition>
      <img :src="'/images/zat/zat_black.svg'" class="SponsorImage left-[3px]" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import gsap from "gsap";

import type { BalootStore, HandStore } from "~/composables/DetectBoard";
import type { SakkaI } from "~/models/game";
const { store } = DetectBoard();
const { snapshot, game, } =
  storeToRefs(store.value as BalootStore | HandStore);
const { gameService } = store.value as BalootStore | HandStore;

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

const mainScoreMount = (score1: number, score2: number) => {

const t1 = gsap.timeline();

t1.to(
  tweenedScores,
  {
    team1: score1,
    team2: score2,
    duration: 0.75,
  },
);
};


const last_sakka = ref<SakkaI>()
const gameState = ref()



onMounted(async () => {
  watchEffect(async () => {
    last_sakka.value = game.value?.sakkas?.[game.value.sakkas.length - 1];
    gameState.value = game.value?.state;
    if (snapshot.value.matches("score.intro")) {
      if (mediaElm.value) {
        mediaElm.value.currentTime = intro_start_sec;
        mediaElm.value.play();

        scoreMount(
          last_sakka.value!.usSakkaScore!,
          last_sakka.value!.themSakkaScore!
        );
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
      mainScoreMount(
        last_sakka.value?.usSakkaScore! ,
        last_sakka.value?.themSakkaScore! 
      );
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

/* .fade-leave-active in <2.1.8 */ {
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
