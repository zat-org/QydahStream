<template v-if="gameService"  >
    
      
    <ScoreZatLandscape v-show="theme =='zat' &&  orienation =='landscape' && snapshot.matches('score') "    />
    <ScoreQydhaLandscape v-show="theme =='qydha' &&  orienation =='landscape' && snapshot.matches('score') "  />
    <ScoreQydhaPortrait v-show="theme =='qydha' &&  orienation =='portrait' && snapshot.matches('score') " class="w-full h-full"    />

    <DetailZatLandscape v-show="theme =='zat' &&  orienation =='landscape' && snapshot.matches('detail') "   />
    <DetailQydhaLandscape v-show="theme =='qydha' &&  orienation =='landscape' && snapshot.matches('detail') "   />
    <DetailQydhaPortrait v-show="theme =='qydha' &&  orienation =='portrait' && snapshot.matches('detail') "    />


    <!-- <Detail v-if="snapshot.matches('detail')" /> -->
    <!-- <Winner v-show="snapshot.matches('winner')" /> -->
 
</template>

<script lang="ts" setup>

const route = useRoute();
const router = useRouter();

const table_id =
  (route.params.id as string) ?? "983365b7-c1dc-4c60-8131-8450ceb934db";
  console.log(table_id)
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

const game = useMyGameStore();
const { gameService, initializeConnection } = game;
await initializeConnection(table_id);
const { snapshot } = storeToRefs(game);
</script>

<style></style>
