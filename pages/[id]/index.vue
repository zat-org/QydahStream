<template v-if="gameService">
<!-- <score-qydha-portraitsvg/> -->
 <!-- <detail-qydha-portrait /> -->
<div v-show="snapshot.matches('score')">
    <component :is="scoreComponent" v-if="snapshot.matches('score') && game" />
  </div>

  <!-- Detail Screen -->
  <div v-show="snapshot.matches('detail')">
    <component
      :is="detailComponent"
      v-if="snapshot.matches('detail') && game"
    />
  </div>

  <div v-show="snapshot.matches('statics')">
    <transition name="fade" mode="out-in">
      <component
        :is="staticsComponent"
        v-if="snapshot.matches('statics') && game"
      />
    </transition>
  </div>

  <div v-show="snapshot.matches('winner')">
    <transition name="fade" mode="out-in">
      <component
        :is="winnerComponent"
        v-if="snapshot.matches('winner') && game"
      />
    </transition>
  </div>
</template>

<script lang="ts" setup>
import ScoreZatLandscape from "../../components/Score/Zat/Landscape.vue";
import DetailZatLandscape from "../../components/Detail/Zat/landscape.vue";
import WinnerZatLandscape from "../../components/winner/Zat/landscape.vue";

import ScoreQydhaLandscape from "../../components/Score/Qydha/landscape.vue";
import DetailQydhaLandscape from "../../components/Detail/Qydha/landscape.vue";
import WinnerQydhaLandscape from "../../components/winner/Qydha/landscape.vue";

// import ScoreQydhaPortrait from "../../components/Score/Qydha/portrait.vue";
import ScoreQydhaPortraitsvg from "../../components/Score/Qydha/portraitsvg.vue";

import DetailQydhaPortrait from "../../components/Detail/Qydha/portrait.vue";
import WinnerQydhaPortrait from "../../components/winner/Qydha/portrait.vue";

import StaticsZat from "../../components/Statics/Zat/landscape.vue";
import StaticsQydha from "../../components/Statics/Qydha/portrait.vue";

const route = useRoute();
const router = useRouter();

const table_id =
  (route.params.id as string) ?? "983365b7-c1dc-4c60-8131-8450ceb934db";
const { getOrCreateTable } = useTable();
await getOrCreateTable(table_id);
const theme = ref("zat");
const orienation = ref("landscape");
const showPlayers = ref(false);

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

router.push({
  path: `/${table_id}/`,
  query: {
    theme: theme.value,
    orienation: orienation.value,
    showPlayers: `${showPlayers.value}`,
  },
});

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

const gamestore = useMyGameStore();
const { gameService, initializeConnection, connection } = gamestore;
await initializeConnection();
if ((connection.state as string) != "Connected") {
  await initializeConnection();
}

const { snapshot, game } = storeToRefs(gamestore);
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
