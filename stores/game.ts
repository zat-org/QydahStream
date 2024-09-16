import { defineStore } from "pinia";
import * as signalR from "@microsoft/signalr";
import type { GameI } from "~/models/game";
import { useMachine } from "@xstate/vue";
import { interpret } from "xstate";
export const useMyGameStore = defineStore("myGameStore",  () => {
  const gameString = ref("");
  // const game = computed<GameI | null>(() => {
  //   if (gameString.value === "") return null;
  //   return JSON.parse(gameString.value);
  // });
  const sakka_ended = ref(false);
  const game = ref<GameI>();
  const connection = new signalR.HubConnectionBuilder()
    .withUrl("https://sam-baloot-admin.online/dev/baloot-games-hub", {
      withCredentials: true,
    })
    .build();

  async function initializeConnection () {
    try {
      await connection.start();
      gameString.value = await connection.invoke(
        "AddToBoardGroup",
        "983365b7-c1dc-4c60-8131-8450ceb934db"
      );
      game.value = JSON.parse(gameString.value);
    } catch (error) {
      console.log(error);
    }

    connection.on(
      "BalootGameStateChanged",
      (eventName: string, gameData: string) => {
        const events = eventName.split(",").map((e) => {
          return e.trim();
        });
        console.log(events);
        if (events.includes("ScoreChanges")) {
          sakka_ended.value = false;

          if (snapshot.value.matches("score")) {
            gameService.send({ type: "TO_OUTRO" });
          }
        }
        if (events.includes("SakkaEnded")) {
          sakka_ended.value = true;
        }
        if (events.includes("GameEnded")) {
          console.log("game ended")
        }
    

        gameString.value = gameData;
        game.value = JSON.parse(gameString.value);
        let winner =false
        if (game?.value && game?.value?.usPlayers.length>0 && game?.value?.themPlayers.length>0 ){
          winner =( game?.value?.usPlayers[0].url && game?.value?.usPlayers[1].url && game?.value?.themPlayers[0].url && game?.value?.themPlayers[1].url && game?.value?.winner ) == null  
      }
      gameService.send({ type: "UPDATE_CONTEXT",  ended:winner });
      }
    );
  }

  // await initializeConnection();
  // export const useNashraMachine = () => {
  const { gameMachine } = useNashraMachine();
  // const { send, snapshot } = useMachine(gameMachine);
  const gameService = interpret(gameMachine).start();
  const snapshot = ref(gameService.getSnapshot());
  gameService.subscribe((state) => {
    snapshot.value = state;
  });

  return {
    gameString,
    game,
    connection,
    snapshot,
    gameService,
    sakka_ended,
    initializeConnection
  };
});
