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
import ScoreZatLandscape from "../../../components/Score/Zat/baloot/Landscape.vue";
import DetailZatLandscape from "../../../components/Detail/Zat/baloot/landscape.vue";
import WinnerZatLandscape from "../../../components/winner/Zat/baloot/landscape.vue";

import ScoreQydhaLandscape from "../../../components/Score/Qydha/baloot/landscape.vue";
import DetailQydhaLandscape from "../../../components/Detail/Qydha/baloot/landscape.vue";
import WinnerQydhaLandscape from "../../../components/winner/Qydha/baloot/landscape.vue";

import ScoreQydhaPortraitsvg from "../../../components/Score/Qydha/baloot/portraitsvg.vue";

import DetailQydhaPortrait from "../../../components/Detail/Qydha/baloot/portrait.vue";
import WinnerQydhaPortrait from "../../../components/winner/Qydha/baloot/portrait.vue";

import StaticsZat from "../../../components/Statics/Zat/baloot/landscape.vue";
import StaticsQydha from "../../../components/Statics/Qydha/baloot/portrait.vue";
import LayoutFallback from "../../../components/LayoutFallback.vue";

const route = useRoute();
const router = useRouter();
const tour_id = route.params.tour_id.toString();
const table_id = route.params.table_id.toString();

const { theme, orientation, themeQuery } = useRouteTheme("qydha");

const gamestore = useMyBalootGameStore();
const { gameService, syncBoardForCurrentRoute } = gamestore;
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
  () => `${route.params.tour_id}:${route.params.table_id}`,
  () => {
    void syncBoardForCurrentRoute();
  },
  { immediate: true },
);

onMounted(() => {
  router.push({
    path: `/tournament/${tour_id}/${table_id}/`,
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
