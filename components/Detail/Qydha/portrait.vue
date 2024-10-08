<template>
  <div class="flex justify-center min-w-[325px] bg-transparent">
    <div class="relative w-[300px] h-[100px]">
      <QydhaSvg ref="svgQydha" class="absolute top-0 left-0 " />

      <div
        class="absolute text-center text-white flex h-[28px] top-[64px]  -translate-x-1/2 left-1/2 w-[280px]">
        <div class="w-1/2 flex items-center" ref="team2wrapper">
          <transition name="fade" mode="out-in">
            <p class="grow  mt-[-5px]" :key="game?.themName">
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
          <p class="w-[38px] mr-[4px] score">
            {{ last_sakka?.themSakkaScore }}
          </p>
        </div>
        <div class="w-1/2 flex items-center" ref="team1wrapper">
          <p class="w-[38px] ml-[4px] score">
            {{ last_sakka?.usSakkaScore }}
          </p>
          <transition name="fade" mode="out-in">
            <p class="grow  mt-[-5px]" key="game?.usName">
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
      <div class=" absolute flex gap-5 w-full justify-center top-[110px]" ref="score">
        <div class="TeamDetailedScore   text-right grow  ">
          <p class="score" v-for="e_m in ended_moshtras">{{ e_m.themAbnat }}</p>
        </div>
        <div class="  bg-gradient-to-b from-orange-500 to-black w-[3px] h-[50vh] rounded-lg  "></div>
        <div class="TeamDetailedScore grow">
          <p class="score" v-for="e_m in ended_moshtras">{{ e_m.usAbnat }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const svgQydha =ref()


const store = useMyGameStore();
import gsap from "gsap";
import type { SakkaI } from "~/models/game";
const { sleep } = useSleep();
const { snapshot, game } = storeToRefs(store);
const { gameService } = store;
const team1wrapper = ref(null);
const team2wrapper = ref(null);
const score = ref(null);

const last_sakka_index = computed(() => {
  return game.value?.sakkas.length! - 1;
});
const last_sakka = computed<SakkaI | undefined>(() => {
  return game.value?.sakkas[last_sakka_index.value];
});

const ended_moshtras = computed(() => {
  return last_sakka.value?.moshtaras.filter((m) => {
    return m.state == "Ended";
  });
});
const scoreMount = () => {
  console.log("start score mount ")
  const t1 = gsap.timeline();
  t1.delay(2);
  t1.fromTo([team1wrapper.value, team2wrapper.value,score.value],{opacity:0}, {
    duration: 2,
    opacity: 1,
    ease: "linear",
  });

};

const scoreUnMount = () => {
  const t2 = gsap.timeline();
  t2.to([team1wrapper.value, team2wrapper.value, score.value], {
    duration: .3,
    opacity: 0,
    ease: "linear",
  });
};

onMounted(() => {
  watchEffect(async () => {
    if (snapshot.value.matches("detail.intro")) {
      if (svgQydha.value) {
        svgQydha.value.enteranimation()
        scoreMount();
      await sleep(4000);

        gameService.send({ type: "NEXT" });
      }
    }
    if (snapshot.value.matches("detail.main")) {
   
      await sleep(2000);
      gameService.send({ type: "TO_OUTRO" });
    }

    if (snapshot.value.matches("detail.outro")) {
      if (svgQydha.value) {
        svgQydha.value.outAnimation()
        scoreUnMount();
        await sleep(2000);
        gameService.send({ type: "CHECK_END" });

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
