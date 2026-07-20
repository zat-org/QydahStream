<template>
  <template v-if="gameService">
    <LayoutFallback
      v-if="layoutUnsupported"
      title="تنسيق غير مدعوم / Unsupported layout"
      hint="استخدم theme=qydha أو zat مع orientation=landscape أو portrait حسب التصميم المتاح."
      :theme="theme"
      :orientation="orientation"
    />

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
import ScoreZatLandscape from "../../../components/Score/Zat/hand/Landscape.vue";
import DetailZatLandscape from "../../../components/Detail/Zat/hand/landscape.vue";
import WinnerZatLandscape from "../../../components/winner/Zat/hand/landscape.vue";

import ScoreQydhaLandscape from "../../../components/Score/Qydha/hand/landscape.vue";
import DetailQydhaLandscape from "../../../components/Detail/Qydha/hand/landscape.vue";
import WinnerQydhaLandscape from "../../../components/winner/Qydha/hand/landscape.vue";

import ScoreQydhaPortraitsvg from "../../../components/Score/Qydha/hand/portraitsvg.vue";

import DetailQydhaPortrait from "../../../components/Detail/Qydha/hand/portrait.vue";
import WinnerQydhaPortrait from "../../../components/winner/Qydha/hand/portrait.vue";

import StaticsZat from "../../../components/Statics/Zat/hand/landscape.vue";
import StaticsQydha from "../../../components/Statics/Qydha/hand/portrait.vue";
import LayoutFallback from "../../../components/LayoutFallback.vue";

const route = useRoute();
const router = useRouter();

const table_id =
  (route.params.id as string) ?? "983365b7-c1dc-4c60-8131-8450ceb934db";

const { theme, orientation, showPlayers, themeQuery, themeQueryNeedsNormalize } =
  useRouteTheme("zat");

const gamestore = useMyHandGameStore();
const { gameService, syncHandForCurrentRoute } = gamestore;
const { snapshot, game } = storeToRefs(gamestore);

const scoreComponent = computed(() => {
  if (theme.value === "zat" && orientation.value === "landscape") {
    return ScoreZatLandscape;
  } else if (theme.value === "qydha" && orientation.value === "landscape") {
    return ScoreQydhaLandscape;
  } else if (theme.value === "qydha" && orientation.value === "portrait") {
    return ScoreQydhaPortraitsvg;
  }
  return null;
});

const detailComponent = computed(() => {
  if (theme.value === "zat" && orientation.value === "landscape") {
    return DetailZatLandscape;
  } else if (theme.value === "qydha" && orientation.value === "landscape") {
    return DetailQydhaLandscape;
  } else if (theme.value === "qydha" && orientation.value === "portrait") {
    return DetailQydhaPortrait;
  }
  return null;
});

const winnerComponent = computed(() => {
  if (theme.value === "zat" && orientation.value === "landscape") {
    return WinnerZatLandscape;
  } else if (theme.value === "qydha" && orientation.value === "landscape") {
    return WinnerQydhaLandscape;
  } else if (theme.value === "qydha" && orientation.value === "portrait") {
    return WinnerQydhaPortrait;
  }
  return null;
});

const staticsComponent = computed(() => {
  if (theme.value === "zat" && orientation.value === "landscape") {
    return StaticsZat;
  } else if (theme.value === "qydha" && orientation.value === "portrait") {
    return StaticsQydha;
  }
  return null;
});

const layoutUnsupported = useLayoutUnsupported(snapshot, {
  scoreComponent,
  detailComponent,
  staticsComponent,
  winnerComponent,
});

watch(
  () => route.params.id,
  (id, prev) => {
    if (id && id !== prev) void syncHandForCurrentRoute();
  },
);

await syncHandForCurrentRoute();

onMounted(() => {
  if (!themeQueryNeedsNormalize()) return;
  // Drop legacy typo / coerce unsupported orientation (e.g. zat+portrait → landscape).
  router.replace({
    path: `/hand/${table_id}/`,
    query: themeQuery(),
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
