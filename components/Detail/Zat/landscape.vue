<template>
  <div class="score-comp">
    <video
      ref="mediaElm"
      class="video-elm"
      muted
      :src="'/videos/zat/Full_Score.webm'"
      height="1080"
      width=" 1920"></video>
    <div class="TeamWrap left-[1062px]" ref="team1wrapper">
      <img
        class="TeamSponsor right-[0px]"
        :src="'/images/zat/zat_white.svg'" />
      <p class="TeamName left-[84px]">
        {{ game?.usName }}
      </p>

      <p id="team1totalScore" class="TeamScore left-0">
        {{ last_sakka?.usSakkaScore }}
      </p>
      <div id="team1-detailed-scores" class="TeamDetailedScore left-0">
        <p class="score" v-for="e_m in ended_moshtras">{{ e_m.usAbnat }}</p>
      </div>
    </div>

    <div class="TeamWrap left-[364px]" ref="team2wrapper">
      <p class="TeamScore right-0">{{ last_sakka?.themSakkaScore }}</p>

      <p class="TeamName left-[115px]">
        {{ game?.themName }}
      </p>

      <img class="TeamSponsor left-[12px]" :src="'/images/zat/zat_black.svg'" />

      <div class="TeamDetailedScore right-0">
        <p class="score" v-for="e_m in ended_moshtras">{{ e_m.themAbnat }}</p>
      </div>
    </div>
  </div>  
</template>

<script lang="ts" setup>

const store = useMyGameStore();
import gsap from "gsap";
import type { SakkaI } from "~/models/game";
const { sleep } = useSleep();
const { snapshot, game } = storeToRefs(store);
const { gameService } = store;
const mediaElm = ref<HTMLVideoElement>();
const team1wrapper = ref(null);
const team2wrapper = ref(null);
const intro_start_sec = 0;
const intro_end_sec = 3.22;
const score_sec = intro_end_sec;
const outro_start = score_sec;

const last_sakka_index = computed(() => {
  return game.value?.sakkas.length! - 1;
});
const last_sakka = computed<SakkaI|undefined>(() => {
  return game.value?.sakkas[last_sakka_index.value] 
});

const ended_moshtras = computed(() => {
  return last_sakka.value?.moshtaras.filter((m) => {
    return m.state == "Ended";
  });
});
const scoreMount = () => {
  const t1 = gsap.timeline();
  t1.delay(1.75);
  t1.to([team1wrapper.value, team2wrapper.value], {
    duration: 0.75,
    opacity: 1,
    ease: "linear",
  });
};

const scoreUnMount = () => {
  const t2 = gsap.timeline();


  t2.to([team1wrapper.value, team2wrapper.value], {
    duration: 1,
    opacity: 0,
    ease: "linear",
  });
};

onMounted(() => {
  watchEffect(async () => {
    if (snapshot.value.matches("detail.intro")) {
      if (mediaElm.value) {
        mediaElm.value.currentTime = intro_start_sec;
        mediaElm.value.play();
        scoreMount();
        await sleep(score_sec*1000)
        mediaElm.value.currentTime = score_sec;
        mediaElm.value.pause();
        gameService.send({ type: "NEXT" });
      }
    }
    if (snapshot.value.matches("detail.main")) {
      if (mediaElm.value) {
        mediaElm.value.currentTime = score_sec;
      }
      await sleep(250);
      gameService.send({ type: "TO_OUTRO" });
    }

    if (snapshot.value.matches("detail.outro")) {
      if (mediaElm.value) {
        mediaElm.value.currentTime = outro_start;
        mediaElm.value.playbackRate = 2;
        mediaElm.value.play();
        scoreUnMount();
        mediaElm.value.onended = () => {
          // mediaElm.value.onended=null;
          gameService.send({ type: "CHECK_END" });
        };
      }
    }
  });
});
</script>
<style scoped>
/* .detailed-score-comp {
} */
/*
  Based on TailwindCSS recommendations,
  consider using classes instead of the `@apply` directive
  @see https://tailwindcss.com/docs/reusing-styles#avoiding-premature-abstraction
*/
.video-elm {
  @apply relative z-[-1] left-0 top-0;
  /* background-color: aquamarine; */
}

.TeamWrap {
  @apply text-[white] text-center w-[499px] h-[97px] absolute opacity-0 top-[62px];
  font-family: "arefBold";
}

.TeamName {
  @apply absolute text-[2rem] h-[81px] flex justify-center items-center top-2 w-[300px];
}

.TeamScore {
  @apply absolute text-[2.8rem] w-[85px] h-[97px] flex justify-center items-center top-0;
  font-family: "CairoSemiBold";
}

.TeamSponsor {
  @apply absolute w-[110px] h-[100px] top-[-5px];
}

.TeamDetailedScore {
  @apply text-[white] absolute w-[85px] text-[1.8rem] top-[125px];
  font-family: "CairoSemiBold";
}

.score {
  @apply font-extrabold text-4xl leading-[3rem] m-0 p-0;
}
</style>
