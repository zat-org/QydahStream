<template>
  <div class="flex justify-center min-w-[325px] bg-transparent">
    <div class="relative">
      <video
        playsinline
        ref="mediaElm"
        width="325px"
        height="150px"
        muted
        :src="videoSrc"></video>
      <div
        class="absolute text-center text-white flex h-[28px] top-[55px] -translate-x-1/2 left-1/2 w-[280px]">
        <div class="w-1/2 flex items-center" ref="team2wrapper">
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
          <p class="w-[38px] ml-[4px] score">
            {{
              !sakka_ended ? last_sakka?.themSakkaScore : game?.themGameScore
            }}
          </p>
        </div>
        <div class="w-1/2 flex items-center" ref="team1wrapper">
          <p class="w-[38px] mr-[4px] score">
            {{ !sakka_ended ? last_sakka?.usSakkaScore : game?.usGameScore }}
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
    </div>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute();
const platform = ((route.query.platform as string)??'android').toLowerCase()
const store = useMyGameStore();
import gsap from "gsap";
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

const preloadVideo = async () => {
  return new Promise<void>((resolve, reject) => {
    if (!mediaElm.value) return reject('Video element not found');
    mediaElm.value.src = videoSrc.value;
    mediaElm.value.preload = 'metadata'; // Load only metadata for quick readiness

    // Event listener for when metadata is loaded
    mediaElm.value.onloadedmetadata = () => {
      resolve(); // Resolve the promise when video metadata is loaded
    };

    // Error handling for loading video
    mediaElm.value.onerror = () => {
      reject('Error loading video metadata');
    };
  });
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

  checkVideoSupport()
 await  preloadVideo()
  watchEffect(() => {
    if (snapshot.value.matches("score.intro")) {
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
