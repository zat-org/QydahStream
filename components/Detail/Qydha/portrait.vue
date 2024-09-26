<template>
  <div class="flex justify-center min-w-[325px] bg-transparent">
    <div class="relative">
      <video
        ref="mediaElm"
        muted
        width="325px"
        height="150px"
        src="/videos/qydha/portrait/Corner_Score.webm"></video>
      <div
        class="absolute text-center text-white flex h-[28px] top-[55px] -translate-x-1/2 left-1/2 w-[280px]">
        <div class="w-1/2 flex items-center" ref="team2wrapper">
          <transition name="fade" mode="out-in">
            <p class="grow" :key="game?.themName">
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
          </transition>
          <p class="w-[38px] ml-[4px] score">
            {{ last_sakka?.themSakkaScore }}
          </p>
        </div>
        <div class="w-1/2 flex items-center" ref="team1wrapper">
          <p class="w-[38px] mr-[4px] score">
            {{ last_sakka?.usSakkaScore }}
          </p>
          <transition name="fade" mode="out-in">
            <p class="grow" key="game?.usName">
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
      <div class="flex gap-10 w-full justify-center" ref="score">
        <div class="TeamDetailedScore grow  text-right">
          <p class="score" v-for="e_m in ended_moshtras">{{ e_m.themAbnat }}</p>
        </div>
        <div class="TeamDetailedScore grow">
          <p class="score" v-for="e_m in ended_moshtras">{{ e_m.usAbnat }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute();

const theme = ref();
const orientaion = ref();
theme.value = route.query.theme;
orientaion.value = route.query.orienation;

const store = useMyGameStore();
import gsap from "gsap";
const { sleep } = useSleep();
const { snapshot, game } = storeToRefs(store);
const { gameService } = store;
const mediaElm = ref<HTMLVideoElement>();
const team1wrapper = ref(null);
const team2wrapper = ref(null);
const score = ref(null);

const intro_start_sec = 0;
const intro_end_sec = 3;
const score_sec = intro_end_sec;
const outro_start = score_sec;

const last_sakka_index = game.value?.sakkas.length! - 1;
const last_sakka = game.value?.sakkas[last_sakka_index];
const ended_moshtras = last_sakka?.moshtaras.filter((m) => {
  return m.state == "Ended";
});
const scoreMount = () => {
  console.log("start score mount ")
  const t1 = gsap.timeline();
  t1.delay(1.5);
  t1.fromTo([team1wrapper.value, team2wrapper.value,score.value],{opacity:0}, {
    duration: 2,
    opacity: 1,
    ease: "linear",
  });

};

const scoreUnMount = () => {
  const t2 = gsap.timeline();
  t2.to([team1wrapper.value, team2wrapper.value, score.value], {
    duration: 1.5,
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
      await sleep(400);
      gameService.send({ type: "TO_OUTRO" });
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

.TeamWrap {
  @apply text-[white] text-center w-[499px] h-[97px] absolute opacity-0 top-[425px];
  font-family: "arefBold";
}

.TeamName {
  @apply absolute text-[2rem] h-[81px] flex justify-center items-center top-2 w-[300px];
}

.TeamScore {
  @apply absolute text-slate-700 text-[2.8rem] w-[100px] h-[97px] flex justify-center items-center top-0;
  font-family: "CairoSemiBold";
}

.TeamSponsor {
  @apply absolute w-[66px] h-[62px] top-[13px];
}

.TeamDetailedScore {
  @apply text-slate-700  w-[85px] text-[2rem];
  font-family: "CairoSemiBold";
}

.score {
  @apply text-slate-700  text-[1rem];
  font-family: "CairoSemiBold";
}

* {
  font-family: "arefBold";
}
</style>
