<template>
  <div>
    <video
      ref="mediaElm"
      class="video"
      muted
      height="1080"
      width="1920"
      src="/videos/qydha/landscape/Corner_Score.webm"
    ></video>
    <div class="left-[970px] teamWrap" ref="team1wrapper">
      <transition name="fade" mode="out-in">
        <p :key="usName" class="left-14 teamName">
          {{ usName }}
        </p>
      </transition>
      <p class="left-[2px] score">
        {{

             gameState == "Ended" ? usGameScore : tweenedScores.team1.toFixed(0)
        }}
      </p>
    </div>

    <div class="left-[621px] teamWrap" ref="team2wrapper">
      <p class="-right-[2px] score">
        {{
        
              gameState == "Ended" ? themGameScore : tweenedScores.team2.toFixed(0)
        }}
      </p>
      <transition name="fade" mode="out-in">
        <p :key="themName" class="teamName left-[82px]">
          {{ themName }}
        </p>
      </transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
import gsap from "gsap";
const { sleep } = useSleep();
const store = useMyBalootGameStore();
const { snapshot, usGameScore,themGameScore,usName,themName,last_sakka,gameState} =storeToRefs(store);
const { gameService } = store;

const mediaElm = ref<HTMLVideoElement>();
const intro_start_sec = 0;
const intro_end_sec = 4.5;
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
  t1.delay(2);
  t1.fromTo(
    [team1wrapper.value, team2wrapper.value],
    { opacity: 0 },
    {
      duration: 1.2,
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
    duration: 0.5,
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

onMounted(() => {
  watchEffect(async () => {

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
        last_sakka.value!.usSakkaScore!,
        last_sakka.value!.themSakkaScore!
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
.fade-enter-from, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  @apply opacity-0;
}

.score {
  @apply text-slate-700 absolute text-[1.9rem] w-[55px] h-[55px] flex justify-center items-center top-0;
  font-family: "CairoSemiBold";
}

.teamName {
  @apply absolute w-[185px]   text-[1.5rem] h-[40px] flex justify-center items-center top-1.5;
}

.teamWrap {
  @apply text-[white] text-center w-[324px] h-[62px] absolute opacity-100 top-[118px];
}

.video {
  @apply relative top-0 left-0 z-[-1];
}

.wrapcomp {
  @apply relative h-screen w-screen;
}
.SponsorImage {
  @apply absolute w-[66px] h-[62px] -top-0.5;
}

* {
  font-family: "arefBold";
}
</style>
