<template v-if="gameService">
  <div v-show="snapshot.matches('score')">
    <component :is="scoreComponent" v-if="snapshot.matches('score')" />
  </div>

  <!-- Detail Screen -->
  <div v-show="snapshot.matches('detail')">
    <component :is="detailComponent" v-if="snapshot.matches('detail')" />
  </div>

  <div v-show="snapshot.matches('winner')">
    <transition name="fade" mode="out-in">
      <component :is="winnerComponent" v-if="snapshot.matches('winner')" />
    </transition>
  </div>
</template>

<script lang="ts" setup>
import ScoreZatLandscape from "../../../components/Score/Zat/Landscape.vue";
import DetailZatLandscape from "../../../components/Detail/Zat/landscape.vue";
import WinnerZatLandscape from "../../../components/winner/Zat/landscape.vue";

import ScoreQydhaLandscape from "../../../components/Score/Qydha/landscape.vue";
import DetailQydhaLandscape from "../../../components/Detail/Qydha/landscape.vue";
import WinnerQydhaLandscape from "../../../components/winner/Qydha/landscape.vue";

// import ScoreQydhaPortrait from "../../components/Score/Qydha/portrait.vue";
import ScoreQydhaPortraitsvg from "../../../components/Score/Qydha/portraitsvg.vue";

import DetailQydhaPortrait from "../../../components/Detail/Qydha/portrait.vue";
import WinnerQydhaPortrait from "../../../components/winner/Qydha/portrait.vue";

const route = useRoute();
const router = useRouter();
const tour_id = route.params.tour_id.toString()
const table_id = route.params.table_id.toString()


const theme = ref("qydha");
const orienation = ref("landscape");


if (
  route.query.theme &&
  (route.query.theme == "zat" || route.query.theme == "qydha")
) {
  theme.value = route.query.theme ? route.query.theme : "qydha";
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

if (
  route.query.platform &&
  ((route.query.platform as string).toLowerCase() == "android" ||
    (route.query.platform as string).toLowerCase() == "ios")
) {
 
}

router.push({
  path: `/tournament/${tour_id}/${table_id}/`,
  query: {
    theme: "qydha",
    orienation: orienation.value,
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

// const table_id =
//   (route.params.id as string) ?? "983365b7-c1dc-4c60-8131-8450ceb934db";
const game = useMyGameStore()
const { gameService, initializeConnection ,connection} = game;
await initializeConnection();
if( (connection.state as string) !="Connected"){
  await initializeConnection();
}

const { snapshot } = storeToRefs(game);
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
