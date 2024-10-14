import { defineStore } from "pinia";
import * as signalR from "@microsoft/signalr";
import type { GameI } from "~/models/game";
import { interpret } from "xstate";
export const useMyGameStore = defineStore("myGameStore", () => {
  const gameString = ref("");
  // const game = computed<GameI | null>(() => {
  //   if (gameString.value === "") return null;
  //   return JSON.parse(gameString.value);
  // });
  const sakka_ended = ref(false);
  const newGameFlag = ref(false);
  const game_updated = ref(false);

  const game = ref<GameI>()!;
  const newGame = ref<GameI>()!;
  const { gameMachine } = useNashraMachine();
  // const { send, snapshot } = useMachine(gameMachine);
  const gameService = interpret(gameMachine).start();
  const snapshot = ref(gameService.getSnapshot());
  gameService.subscribe((state) => {
    snapshot.value = state;

    if (
      snapshot.value.matches("score") &&
      newGame.value &&
      game.value &&
      newGame.value.id !== game.value.id
    ) {
      console.log("stat nwe game");
      game.value = newGame.value;
    }
  });

  const connection = new signalR.HubConnectionBuilder()
    .withUrl("https://sam-baloot-admin.online/qydha/baloot-games-hub", {
      withCredentials: true,
    })
    .build();

  async function initializeConnection() {
    try {
      await connection.start();
      const route =useRoute()
      const player_table_id =  route.params.id?.toString() 
      const table_id = route.params.table_id?.toString()
      const tour_id = route.params.tour_id?.toString()
      console.log(player_table_id,table_id,tour_id)
      if (table_id && tour_id) {
      gameString.value = await connection.invoke("AddToTournamentTableGroup",+tour_id , +table_id);
      }else{
        gameString.value = await connection.invoke("AddToBoardGroup", +player_table_id);
      }

      game.value = JSON.parse(gameString.value);
      console.log(game.value)
    } catch (error) {
      console.log(error);
    }

    connection.on(  
      "BalootGameStateChanged",
      (eventName: string, gameData: string) => {
        newGameFlag.value = false;
        game_updated.value = false;
        const events = eventName.split(",").map((e) => {
          return e.trim();
        });
        console.log(events);

        const newGameEvent = events.includes("GameStarted");

        newGameFlag.value = newGameEvent;
        gameString.value = gameData;
        newGame.value = JSON.parse(gameString.value);
        console.log(newGame.value);
        if (snapshot.value.matches("detail")) {
          if (newGameEvent) {
          } else {
            game.value = newGame.value;
          }
        } else if (snapshot.value.matches("winner")) {
        } else if (snapshot.value.matches("score")) {
          
          if (events.includes("NamesChanged") ) {
            game.value = newGame.value
            game.value = newGame.value
  
          }

          if (newGameEvent) {
            game.value = newGame.value;
          } 
          else if (events.includes("ScoreIncreased")) {
            gameService.send({ type: "TO_OUTRO" });
            game.value = newGame.value;
          } else if (
            events.includes("ScoreUpdated") ||
            events.includes("ScoreDecreased")
          ) {
            if (
              events.includes("ScoreUpdated") &&
              newGame.value?.winner !== null
            ) {
              gameService.send({ type: "TO_OUTRO" });
            }
            game.value = newGame.value;
            game_updated.value = true;
          } else {
            game.value = newGame.value;
          }
        }

   
        if (events.includes("SakkaEnded")) {
          sakka_ended.value = true;
        }
        if (events.includes("GameEnded")) {
          console.log("game ended");

          let winner = false;

          const us_photo =
            game?.value &&
            game?.value?.usPlayers.length > 0 &&
            game?.value?.usPlayers[0].url &&
            game?.value?.usPlayers[1].url;
          const them_photo =
            game?.value &&
            game?.value?.themPlayers.length > 0 &&
            game?.value?.themPlayers[0].url &&
            game?.value?.themPlayers[1].url;

          if (game?.value?.winner) {
            if (game?.value?.winner == "Us" && us_photo) {
              winner = true;
            } else if (game?.value?.winner == "Them" && them_photo) {
              winner = true;
            }
          }

          gameService.send({ type: "UPDATE_CONTEXT", ended: winner });
        }
      }
    );
  }


  // await initializeConnection();
  // export const useNashraMachine = () => {

  return {
    game_updated,
    newGameFlag,
    gameString,
    game,
    connection,
    snapshot,
    gameService,
    sakka_ended,
    initializeConnection,
  };
});
