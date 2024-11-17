import { defineStore } from "pinia";
import * as signalR from "@microsoft/signalr";
import type { GameI, IStatics } from "~/models/game";
import { interpret } from "xstate";
export const useMyGameStore = defineStore("myGameStore", () => {
  const gameString = ref("");
  const staticString = ref("");
  const statics = ref<IStatics>()

  const config = useRuntimeConfig();

  const sakka_ended = ref(false);
  const newGameFlag = ref(false);
  const game_updated = ref(false);

  const game = ref<GameI>()!;
  const newGame = ref<GameI>()!;
  const { gameMachine } = useNashraMachine();
  const gameService = interpret(gameMachine).start();
  const snapshot = ref(gameService.getSnapshot());
  gameService.subscribe((state) => {
    snapshot.value = state;
    if (
      snapshot.value.matches("score") &&
      snapshot.value.matches("score.intro") &&
      newGame.value &&
      game.value &&
      (newGame.value.id !== game.value.id || sakka_ended.value)
    ) {
      console.log("game change in watch state ")
      game.value = newGame.value;
    }
  });

  const connection = new signalR.HubConnectionBuilder()
    .withUrl(config.public.qydhaapi, {
      withCredentials: true,
    })
    .build();

  async function initializeConnection() {
    try {
      await connection.start();
      const route = useRoute()
      const player_table_id = route.params.id?.toString()
      const table_id = route.params.table_id?.toString()
      const tour_id = route.params.tour_id?.toString()


      if (table_id && tour_id) {
        gameString.value = await connection.invoke("AddToTournamentTableGroup", +tour_id, +table_id);
      } else {
        gameString.value = await connection.invoke("AddToBoardGroup", player_table_id);
      }
      game.value = JSON.parse(gameString.value);
      game.value = sakkaIsMashdoda(game.value!)
    } catch (error) {
      console.log(error);
    }

    connection.on(
      "BalootGameStateChanged",
      (eventName: string, gameData: string, gameStatics?: string) => {
        newGameFlag.value = false;
        game_updated.value = false;
        sakka_ended.value = false;
        const events = eventName.split(",").map((e) => {
          return e.trim();
        });
        console.log(events);

        const newGameEvent = events.includes("GameStarted");
        const sakaaEnded = events.includes("SakkaEnded")
        const SakaaStarted = events.includes("SakkaStarted")

        newGameFlag.value = newGameEvent;
        gameString.value = gameData;
        if (gameStatics) {
          staticString.value = gameStatics;
          statics.value = JSON.parse(staticString.value)
        }

        newGame.value = JSON.parse(gameString.value);
        console.log(newGame.value);
        if (snapshot.value.matches("detail")) {
          if (newGameEvent || sakaaEnded || SakaaStarted) {
          } else {
            console.log("game changed  in detail in not new ggame stated")

            if (events.includes('ScoreDecreased') && newGame.value?.winner == null) {
              gameService.send({ type: "UPDATE_CONTEXT", ended: null });
            }

            if (snapshot.value.context.ended) {

            } else {
              game.value = newGame.value;
            }
          }
        } else if (snapshot.value.matches("winner")) {
        } else if (snapshot.value.matches("statics")) {
        }
        else if (snapshot.value.matches("score")) {
          if (events.includes("NamesChanged") && events.length == 1) {
            console.log("game changed in score  in name changed ")
            game.value = newGame.value
          }

          if (newGameEvent) {
            // console.log("game changed in score  in start game  ")
            // game.value = newGame.value
          }
          else
            if (events.includes("ScoreIncreased")) {
              gameService.send({ type: "TO_OUTRO" });
              console.log("game changed in socre  score increase ")
              game.value = newGame.value;
            }
            else if (
              events.includes("ScoreUpdated") ||
              events.includes("ScoreDecreased")
            ) {
              if (
                events.includes("ScoreUpdated") &&
                newGame.value?.winner !== null
              ) {
                gameService.send({ type: "TO_OUTRO" });
              }
              console.log("game changed in socre  score increase 2")

              game.value = newGame.value;
              game_updated.value = true;
            } else {
              // game.value = newGame.value;
            }
        }


        if (events.includes("SakkaEnded")) {
          sakka_ended.value = true;
          if (statics.value) {
            let moshtraCount = statics.value?.themStatistics.moshtaraHokmCount + statics.value?.themStatistics.moshtaraSunCount + statics.value?.usStatistics.moshtaraHokmCount + statics.value?.usStatistics.moshtaraSunCount

            gameService.send({ type: "UPDATE_ENDSAKKA", sakkaended: moshtraCount > 0 ? true : false });
          }
        }
        if (events.includes("SakkaStarted")) {
          sakka_ended.value = true;
        }

        if (events.includes("GameEnded")) {

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

        game.value = sakkaIsMashdoda(game.value!)

      }
    );
  }


  // await initializeConnection();
  // export const useNashraMachine = () => {

  const sakkaIsMashdoda = (game: GameI): GameI | undefined => {
    if (game.sakkas.length <= 0) return;
    const lastSakka = game.sakkas[game.sakkas.length - 1]
    if (lastSakka.isMashdoda) {
      // add mostra 50 - 50 
      // add 50 to us and them in this score

      lastSakka.usSakkaScore += 52
      lastSakka.themSakkaScore += 52
      const dummy_moshtra = lastSakka.moshtaras.find((m) => { m.state == "addinfront" })
      if (!dummy_moshtra) {
        lastSakka.moshtaras.unshift({
          id: 20,
          usAbnat: 50,
          themAbnat: 50,
          state: "addinfront",
          advancedDetails: null
        })
      }
    }
    else {
      // handele delete can be doing nothinng
    }
    console.log("masdda", game)
    return game
  }

  return {
    game_updated,
    newGameFlag,
    gameString,
    game,
    connection,
    snapshot,
    gameService,
    sakka_ended,
    statics,
    initializeConnection,
  };
});
