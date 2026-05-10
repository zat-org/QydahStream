<template>
  <template v-if="gameService">
    <BalootLayoutFallback
      v-if="layoutUnsupported"
      title="تنسيق غير مدعوم / Unsupported layout"
      hint="استخدم theme=qydha أو zat مع orientation=landscape أو portrait حسب التصميم المتاح."
      :theme="theme"
      :orientation="orienation"
    />

    <div
      v-if="showObsDebug"
      class="fixed top-2 right-2 z-[9998] max-w-[min(92vw,380px)] rounded border border-emerald-700/80 bg-black/85 px-2 py-1.5 font-mono text-[10px] leading-snug text-emerald-300 shadow-lg"
      dir="ltr"
    >
      <div>hub: {{ hubConnectionState }}</div>
      <div v-if="hubConnectionError">hubErr: {{ hubConnectionError }}</div>
      <div v-if="syncLastError">sync: {{ syncLastError }}</div>
    </div>

    <div v-show="snapshot.matches('score')">
      <component
        :is="scoreComponent"
        v-if="snapshot.matches('score') && game && scoreComponent"
      />
    </div>

    <div v-show="snapshot.matches('detail')">
      <component
        :is="detailComponent"
        v-if="snapshot.matches('detail') && game && detailComponent"
      />
    </div>

    <div v-show="snapshot.matches('statics')">
      <transition name="fade" mode="out-in">
        <component
          :is="staticsComponent"
          v-if="snapshot.matches('statics') && game && staticsComponent"
        />
      </transition>
    </div>

    <div v-show="snapshot.matches('winner')">
      <transition name="fade" mode="out-in">
        <component
          :is="winnerComponent"
          v-if="snapshot.matches('winner') && game && winnerComponent"
        />
      </transition>
    </div>
  </template>
</template>

<script lang="ts" setup>
import ScoreZatLandscape from "../../components/Score/Zat/baloot/Landscape.vue";
import DetailZatLandscape from "../../components/Detail/Zat/baloot/landscape.vue";
import WinnerZatLandscape from "../../components/winner/Zat/baloot/landscape.vue";

import ScoreQydhaLandscape from "../../components/Score/Qydha/baloot/landscape.vue";
import DetailQydhaLandscape from "../../components/Detail/Qydha/baloot/landscape.vue";
import WinnerQydhaLandscape from "../../components/winner/Qydha/baloot/landscape.vue";

import ScoreQydhaPortraitsvg from "../../components/Score/Qydha/baloot/portraitsvg.vue";

import DetailQydhaPortrait from "../../components/Detail/Qydha/baloot/portrait.vue";
import WinnerQydhaPortrait from "../../components/winner/Qydha/baloot/portrait.vue";

import StaticsZat from "../../components/Statics/Zat/baloot/landscape.vue";
import StaticsQydha from "../../components/Statics/Qydha/baloot/portrait.vue";
import BalootLayoutFallback from "../../components/BalootLayoutFallback.vue";

const route = useRoute();
const router = useRouter();

const table_id =
  (route.params.id as string) ?? "983365b7-c1dc-4c60-8131-8450ceb934db";

const theme = ref("zat");
const orienation = ref("landscape");
const showPlayers = ref(false);

const showObsDebug = computed(
  () =>
    route.query.obsDebug === "1" ||
    route.query.obsDebug === "true" ||
    route.query.debugErrors === "1" ||
    route.query.debugErrors === "true",
);

if (
  route.query.theme &&
  (route.query.theme == "zat" || route.query.theme == "qydha")
) {
  theme.value = route.query.theme ? route.query.theme : "zat";
}
if (
  route.query.orienation &&
  (route.query.orienation == "landscape" ||
    route.query.orienation == "portrait")
) {
  orienation.value = route.query.orienation
    ? route.query.orienation
    : "landscape";
}

if (route.query.showPlayers) {
  showPlayers.value = route.query.showPlayers == "true" ? true : false;
}

const scoreComponent = computed(() => {
  if (theme.value === "zat" && orienation.value === "landscape") {
    return ScoreZatLandscape;
  } else if (theme.value === "qydha" && orienation.value === "landscape") {
    return ScoreQydhaLandscape;
  } else if (theme.value === "qydha" && orienation.value === "portrait") {
    return ScoreQydhaPortraitsvg;
  }
  return null;
});

const detailComponent = computed(() => {
  if (theme.value === "zat" && orienation.value === "landscape") {
    return DetailZatLandscape;
  } else if (theme.value === "qydha" && orienation.value === "landscape") {
    return DetailQydhaLandscape;
  } else if (theme.value === "qydha" && orienation.value === "portrait") {
    return DetailQydhaPortrait;
  }
  return null;
});

const winnerComponent = computed(() => {
  if (theme.value === "zat" && orienation.value === "landscape") {
    return WinnerZatLandscape;
  } else if (theme.value === "qydha" && orienation.value === "landscape") {
    return WinnerQydhaLandscape;
  } else if (theme.value === "qydha" && orienation.value === "portrait") {
    return WinnerQydhaPortrait;
  }
  return null;
});

const staticsComponent = computed(() => {
  if (theme.value === "zat" && orienation.value === "landscape") {
    return StaticsZat;
  } else if (theme.value === "qydha" && orienation.value === "landscape") {
    return StaticsZat;
  } else if (theme.value === "qydha" && orienation.value === "portrait") {
    return StaticsQydha;
  }
  return null;
});

const layoutUnsupported = computed(() => {
  const s = snapshot.value;
  if (s.matches("score")) return scoreComponent.value == null;
  if (s.matches("detail")) return detailComponent.value == null;
  if (s.matches("statics")) return staticsComponent.value == null;
  if (s.matches("winner")) return winnerComponent.value == null;
  return false;
});

const gamestore = useMyBalootGameStore();
const { gameService, syncBoardForCurrentRoute } = gamestore;
const {
  snapshot,
  game,
  hubConnectionState,
  hubConnectionError,
  syncLastError,
} = storeToRefs(gamestore);

watch(
  () => route.params.id,
  (id, prev) => {
    if (id && id !== prev) void syncBoardForCurrentRoute();
  },
);

await syncBoardForCurrentRoute();

onMounted(() => {
  router.push({
    path: `/${table_id}/`,
    query: {
      theme: theme.value,
      orienation: orienation.value,
      showPlayers: `${showPlayers.value}`,
    },
  });
});
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  @apply transition-opacity duration-[2s] ease-[ease];
}
.fade-enter-from, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  @apply opacity-0;
}
</style>
