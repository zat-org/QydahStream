<template>
  <ScoreQydhaPortraitsvg />
  
  <div class="absolute w-full h-full  left-0 top-0 flex justify-center items-center ">
    <div class=" font-state-field p-5  w-[50%] text-center font-bold bg-red-500/10 border border-red-500 ">
      هذة صورة تجريبية برجاء تسجيل الدخول للاستمتاع بتجربة كاملة
    </div>
  </div>
</template>

<script lang="ts" setup>

import ScoreQydhaPortraitsvg from "../components/Score/Qydha/portraitsvg.vue";



const gamestore = useMyGameStore();
const { gameService, initializeConnection, connection, } = gamestore;
await initializeConnection();
if ((connection.state as string) != "Connected") {
  await initializeConnection();
}

const { snapshot, game } = storeToRefs(gamestore);
game.value = {
  createdAt: "2024-10-25T17:53:58.744865+00:00",
  endedAt: null,
  gameMode: "SinglePlayer",
  id: "c39f2a8f-50eb-45e9-90b9-7ae6d7a29af9",
  maxSakkaPerGame: 1,
  sakkas: [{
    id: 142,
    isMashdoda: false,
    moshtaras: [
      {
        advancedDetails: null,
        id: 250,
        state: "Running",
        themAbnat: 0,
        usAbnat: 0,
      }
    ],
    state: "Running",
    themSakkaScore: 0,
    usSakkaScore: 0,
    winner: null
  }],
  startedAt: "2024-10-25T17:53:58.79914+00:00",
  state: "Running",
  themGameScore: 0,
  themName: "لهم",
  themPlayers: [],
  usGameScore: 0,
  usName: "لنا",
  usPlayers: [],
  winner: null
}
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  @apply transition-opacity duration-[2s] ease-[ease];
}

.fade-enter-from,
.fade-leave-to

/* .fade-leave-active in <2.1.8 */
  {
  @apply opacity-0;
}
</style>
