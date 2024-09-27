<template>
  <div v-if="gameService" class="w-screen h-screen">
    <Score v-if="snapshot.matches('score')" />
    <Detail v-if="snapshot.matches('detail')" />
    <Winner v-if="snapshot.matches('winner')" />
  </div>
</template>

<script lang="ts" setup>
import { storeToRefs } from "pinia";
const route = useRoute();
const router = useRouter();

const platform = ref("android");
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
 { orienation.value = route.query.orienation
    ? route.query.orienation
    : "landscape";}

    
if (
  route.query.platform &&
  ((route.query.platform as string).toLowerCase()== "android" ||
    (route.query.platform as string).toLowerCase() == "ios")
)
{
  platform.value = route.query.platform
    ? (route.query.platform as string).toLowerCase()
    : "android";
}


router.push({
  path: "",
  query: { theme: theme.value, orienation: orienation.value,platform:platform.value },
});

const game = useMyGameStore();
const { gameService, initializeConnection } = game;
await initializeConnection("983365b7-c1dc-4c60-8131-8450ceb934db");
const { snapshot } = storeToRefs(game);
</script>

<style></style>
