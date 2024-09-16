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
// table_id
// theme = zat |Qydha
// orientation = landscap|  portrait
// const table_id = route.query.table_id
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
  path: "",
  query: { theme: theme.value, orienation: orienation.value },
});

const game = useMyGameStore();
const { gameService, initializeConnection } = game;
await initializeConnection();
const { snapshot } = storeToRefs(game);
</script>

<style></style>
