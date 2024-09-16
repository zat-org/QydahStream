<template>
  <div class="score-comp">
    <video
      ref="mediaElm"
      class="video-elm"
      muted
      :src="'/videos/'+theme+'/Full_Score.webm'"
      :height="orientaion=='landscape' ? '1080' : '1920' "
      :width="orientaion=='landscape' ? '1920' : '1080' "></video>
    <div id="team1wrapper" ref="team1wrapper">
     
      <img
        id="rightSponsor"
        class="imageContainer"
         
        :src="'/images/'+theme+'/zat_white.svg'" />
      <p id="team1name">
        {{ game?.usName }}
      </p>

      <p id="team1totalScore">{{last_sakka!.usSakkaScore }}</p>
      <div id="team1-detailed-scores">
        <p class="score" v-for="e_m in ended_moshtras">{{ e_m.usAbnat }}</p>
      </div>
    </div>

    <div id="team2wrapper" ref="team2wrapper">
      <p id="team2totalScore">{{ last_sakka!.themSakkaScore}}</p>

      <p id="team2name">
        {{ game?.themName }}
      </p>

      <img
        id="leftSponsor"
        class="imageContainer"
        :src="'/images/'+theme+'/zat_black.svg'" />

      <div id="team2-detailed-scores">
        <p class="score" v-for="e_m in ended_moshtras">{{e_m.themAbnat }}</p>
      </div>
    </div>
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
const {sleep } =useSleep()
const { snapshot, game } = storeToRefs(store);
const { gameService } = store;
const mediaElm = ref<HTMLVideoElement>();
const team1wrapper = ref(null);
const team2wrapper = ref(null);
const intro_start_sec = 0;
const intro_end_sec = 4;
const score_sec = intro_end_sec;
const outro_start = score_sec;

const last_sakka_index = game.value?.sakkas.length!-1
const last_sakka = game.value?.sakkas[ last_sakka_index]
const ended_moshtras =last_sakka?.moshtaras.filter(m=>{
  return m.state=="Ended"
})
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
  watchEffect(async() => {
    if (snapshot.value.matches("detail.intro")) {
      if (mediaElm.value) {
        mediaElm.value.currentTime = intro_start_sec;
        mediaElm.value.play();
        scoreMount();
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
    if (snapshot.value.matches("detail.main")) {
      if (mediaElm.value) {
        mediaElm.value.currentTime = score_sec;
      }
      await sleep(250);
      gameService.send({ type: 'TO_OUTRO' })
    }

    if (snapshot.value.matches("detail.outro")) {
      if (mediaElm.value) {
        mediaElm.value.currentTime = outro_start;
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
#team1wrapper,
#team2wrapper {
  @apply text-[white] text-center w-[499px] h-[97px] absolute opacity-0 top-[62px];
  font-family: "arefBold";
  /* background-color: bisque; */
}
#team1wrapper {
  @apply left-[1062px] top-[61px];
}
#team2wrapper {
  @apply left-[364px] top-[62px];
}
#team1name,
#team2name {
  @apply absolute text-[2rem] h-[81px] flex justify-center items-center top-2;
  /* background-color: aqua; */
}
#team1name {
  @apply w-[300px] left-[84px];
}
#team2name {
  @apply w-[300px] left-[115px];
}
#team1totalScore,
#team2totalScore {
  @apply absolute text-[2.8rem] w-[85px] h-[97px] flex justify-center items-center top-0;
  font-family: "CairoSemiBold";
}
#team1totalScore {
  @apply left-0;
}
#team2totalScore {
  @apply right-0;
}
#leftSponsor,
#rightSponsor {
  @apply absolute w-[66px] h-[62px] top-[13px];
}
#leftSponsor {
  @apply left-[30px];
}
#rightSponsor {
  @apply right-[30px];
}
#team1-detailed-scores,
#team2-detailed-scores {
  @apply text-[black] absolute w-[85px] text-[1.8rem] top-[125px];
  font-family: "CairoSemiBold";
}
#team1-detailed-scores {
  @apply left-0;
}
#team2-detailed-scores {
  @apply right-0;
}
.score {
  @apply font-extrabold text-5xl leading-[3rem] m-0 p-0;
}

</style>
