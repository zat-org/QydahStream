<template v-if="gameService">

<div v-show="snapshot.matches('score')">
    <transition name="fade" mode="out-in">
      <component :is="scoreComponent" v-if="snapshot.matches('score')" />
    </transition>
  </div>

  <!-- Detail Screen -->
  <div v-show="snapshot.matches('detail')">
    <transition name="fade" mode="out-in">
      <component :is="detailComponent" v-if="snapshot.matches('detail')" />
    </transition>
  </div>


</template>

<script lang="ts" setup>
import  ScoreZatLandscape from '../components/Score/Zat/Landscape.vue';
import DetailZatLandscape from '../components/Detail/Zat/landscape.vue';
import  ScoreQydhaLandscape  from '../components/Score/Qydha/landscape.vue';
import  DetailQydhaLandscape  from '../components/Detail/Qydha/landscape.vue';
import  ScoreQydhaPortrait  from '../components/Score/Qydha/portrait.vue';
import  DetailQydhaPortrait  from '../components/Detail/Qydha/portrait.vue';


const route = useRoute();
const router = useRouter();

const table_id =
  (route.params.id as string) ?? "983365b7-c1dc-4c60-8131-8450ceb934db";
console.log(table_id);
const theme = ref("zat");

const orienation = ref("landscape");

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
)
  orienation.value = route.query.orienation
    ? route.query.orienation
    : "landscape";
router.push({
  path: `/${table_id}/`,
  query: { theme: theme.value, orienation: orienation.value },
});

const scoreComponent = computed(() => {
  if (theme.value === 'zat' && orienation.value === 'landscape') {
    return ScoreZatLandscape;
  } else if (theme.value === 'qydha' && orienation.value === 'landscape') {
    return ScoreQydhaLandscape;
  } else if (theme.value === 'qydha' && orienation.value === 'portrait') {
    return ScoreQydhaPortrait;
  }
  return null;
});

const detailComponent = computed(() => {
  if (theme.value === 'zat' && orienation.value === 'landscape') {
    return DetailZatLandscape;
  } else if (theme.value === 'qydha' && orienation.value === 'landscape') {
    return DetailQydhaLandscape;
  } else if (theme.value === 'qydha' && orienation.value === 'portrait') {
    return DetailQydhaPortrait;
  }
  return null;
});




const game = useMyGameStore();
const { gameService, initializeConnection } = game;
await initializeConnection(table_id);
const { snapshot } = storeToRefs(game);
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  @apply transition-opacity duration-[1s] ease-[ease];
}
.fade-enter-from, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  @apply opacity-0;
}
</style>
