import { defineStore } from "pinia";
import type { BoardSettingsI, GameDataI, GameI, IStatics } from "~/models/game";
import { interpret } from "xstate";
import {
  createGameConnection,
  parseEvents,
  type GameConnection,
  ConnectionState,
} from "~/utils/connection";

type BalootGameEvent =
  | "GameStarted"
  | "GameEnded"
  | "SakkaEnded"
  | "SakkaStarted"
  | "ScoreIncreased"
  | "ScoreDecreased"
  | "ScoreUpdated"
  | "NamesChanged"
  | "IsCurrentSakkaMashdodaChanged"
  | "MaxSakkaCountChanged";
export const useMyBalootGameStore = defineStore("myBalootGameStore", () => {
  const balootSocket = useRuntimeConfig().public.BalootSocket;

  // Create connection instance
  const gameConnection = createGameConnection(balootSocket, {
    withCredentials: true,
    autoReconnect: true,
    maxReconnectAttempts: 5,
  });

  const sakka_ended = ref(false);
  const newGameFlag = ref(false);
  // const game_updated = ref(false);
  const statics = ref<IStatics>();
  const game = ref<GameDataI>()!;
  const boardSettings = ref<BoardSettingsI>()!;
  const newGame = ref<GameDataI>()!;

  let events: BalootGameEvent[] = [];

  const { gameMachine } = useNashraMachine();
  const gameService = interpret(gameMachine).start();
  const snapshot = ref(gameService.getSnapshot());

  // State machine subscription with debugging
  gameService.subscribe((state) => {
    snapshot.value = state;

    if (state.matches("score.intro")) {
      game.value = newGame.value;
    }
  });
  const resetState = () => {
    newGameFlag.value = false;
    sakka_ended.value = false;
  };

  const handleGameStateChanged = (
    _events: any,
    _gamedata: any,
    _statics: any
  ) => {
    try {
      resetState();

      // CRITICAL: Update snapshot to get current state machine state
      snapshot.value = gameService.getSnapshot();

      events = parseEvents<BalootGameEvent>(_events);

      if (_statics) {
        try {
          statics.value = JSON.parse(_statics) as IStatics;
          console.log("Updated statistics:", statics.value);
        } catch (error) {
          console.error("Failed to parse game statistics:", error);
        }
      }

      try {
        const parsedNewGame = JSON.parse(_gamedata) as GameDataI;
        newGame.value = sakkaIsMashdoda(parsedNewGame) as GameDataI;
      } catch (error) {
        console.error("Failed to parse game data:", error);
        return;
      }

      handleStateSpecificEvents();

      handleSpecialEvents();
    } catch (error) {
      console.error("Error in handleGameStateChanged:", error);
    }
  };

  const setupBalootEventListeners = () => {
    const connection = gameConnection.rawConnection;
    connection.on("BalootGameStateChanged", handleGameStateChanged);
  };

  const handleStateSpecificEvents = () => {
    const currentState = snapshot.value;

    if (currentState.matches("detail")) {
      handelDetail();
    } else if (currentState.matches("winner")) {
      handelWinner();
    } else if (currentState.matches("statics")) {
      handelStatics();
    } else if (currentState.matches("score")) {
      if (currentState.matches("score.main")) {
        handelScore();
      }
    }
  };

  // Handle special events that can occur in any state
  const handleSpecialEvents = () => {
    if (events.includes("SakkaEnded")) {
      handelSakkaEnded();
    }

    if (events.includes("SakkaStarted")) {
      console.log("Sakka started");
    }

    if (events.includes("GameEnded")) {
      handelGameEnded();
    }
  };

  // Event listeners are now handled by the GameConnection class

  // join the match that wanted
  const joinGameGroup = async (): Promise<GameI | null> => {
    const route = useRoute();
    const player_table_id = route.params.id?.toString();
    const table_id = route.params.table_id?.toString();
    const tour_id = route.params.tour_id?.toString();

    try {
      let gameData: string;
      if (table_id && tour_id) {
        // tournament table
        gameData = await gameConnection.joinTournamentTableGroup(
          +tour_id,
          +table_id
        );
      } else {
        // board table
        gameData = await gameConnection.joinBoardGroup(player_table_id!);
      }

      if (gameData) {
        const parsedGame = JSON.parse(gameData) as GameI;
        parsedGame.gameData = sakkaIsMashdoda(parsedGame.gameData) as GameDataI;
        return parsedGame;
      }
    } catch (error) {
      console.error("Failed to join game group:", error);
      throw error;
    }

    return null;
  };

  // Main connection initialization function
  // statr connection get aintial datat liste to chnges o it
  async function initializeConnection() {
    try {
      await gameConnection.initializeConnection();
      const initialGame = await joinGameGroup();
      if (initialGame) {
        game.value = initialGame.gameData;
        boardSettings.value = initialGame.boardSettings;
      }
      setupBalootEventListeners();
    } catch (error) {
      console.error("Failed to initialize connection:", error);
      throw error;
    }
  }

  const sakkaIsMashdoda = (game: GameDataI): GameDataI => {
    if (game.sakkas && game.sakkas.length <= 0) return game;
    const lastSakka = game.sakkas[game.sakkas.length - 1];
    if (lastSakka.isMashdoda) {
      const dummy_moshtra = lastSakka.moshtaras.find((m) => m.id === 0);
      if (!dummy_moshtra) {
        lastSakka.usSakkaScore += 52;
        lastSakka.themSakkaScore += 52;
        lastSakka.moshtaras.unshift({
          id: 0,
          usAbnat: 52,
          themAbnat: 52,
          state: "Ended",
          advancedDetails: {
            moshtara: "50-50",
            selectedMoshtaraOwner: "Us",
          },
          startedAt: "",
          endedAt: "",
          pausingIntervals: [],
          isMoshtaraSucceeded: null,
          moshtaraOwner: null,
        });
      }
    }
    return game;
  };

  const handelDetail = () => {
    if (
      events.includes("GameStarted") ||
      events.includes("SakkaEnded") ||
      events.includes("SakkaStarted")
    ) {
    }
    if (events.includes("ScoreDecreased") && newGame.value?.winner == null) {
      gameService.send({ type: "UPDATE_CONTEXT", ended: null });
      game.value!.sakkas = newGame.value!.sakkas;
    }
    if (events.includes("ScoreIncreased") && newGame.value?.winner == null) {
      game.value!.sakkas = newGame.value!.sakkas;
    }
  };
  const handelWinner = () => {};
  const handelStatics = () => {};

  const handelScore = () => {
    if (events.includes("NamesChanged") && events.length == 1) {
      game.value!.themName = newGame.value?.themName!;
      game.value!.usName = newGame.value?.usName!;
      game.value!.themPlayers = newGame.value?.themPlayers!;
      game.value!.usPlayers = newGame.value?.usPlayers!;
    }
    const eventsToCheck: BalootGameEvent[] = [
      "GameStarted",
      "NamesChanged",
      "MaxSakkaCountChanged",
      "IsCurrentSakkaMashdodaChanged",
      "SakkaStarted",
    ];
    if (eventsToCheck.every((event) => events.includes(event))) {
      game.value = newGame.value;
    }
    if (events.includes("IsCurrentSakkaMashdodaChanged")) {
      game.value = newGame.value;
    }

    if (events.includes("ScoreIncreased")) {
      gameService.send({ type: "TO_OUTRO" });
        const gameedndedevents:BalootGameEvent[]=["SakkaEnded", "GameEnded"]
      if (gameedndedevents.every((event) => events.includes(event))) {
        game.value = newGame.value;
      }else{        
        game.value!.sakkas = newGame.value?.sakkas!;
      }

    }
    if (events.includes("ScoreUpdated") && newGame.value?.winner !== null) {
      gameService.send({ type: "TO_OUTRO" });
      game.value = newGame.value;
    }

    if (events.includes("ScoreUpdated") || events.includes("ScoreDecreased")) {
      game.value!.sakkas = newGame.value?.sakkas!;
    }
  };
  // to show  winner
  const handelGameEnded = () => {
    let winner = false;
    console.log(newGame.value)
    console.log(game.value)

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
    console.log("winenr", winner);
    gameService.send({ type: "UPDATE_CONTEXT", ended: winner });
  };
  // to show statics
  const handelSakkaEnded = () => {
    sakka_ended.value = true;
    if (statics.value) {
      const advanced_write = game.value?.sakkas[
        game.value?.sakkas.length - 1
      ].moshtaras.every((m) => {
        return m.advancedDetails != null;
      });

      console.log("show statistics", advanced_write);
      if (advanced_write) {
        gameService.send({ type: "UPDATE_ENDSAKKA", sakkaended: true });
      }
    }
  };

  const setGameData = (gameData: any) => {
    if (!game.value) {
      game.value = gameData as GameDataI;
    } else {
      game.value = gameData as GameDataI;
    }
  };

  return {
    // Existing reactive data
    // game_updated,

    game: game,
    boardSettings: boardSettings,
    statics,
    snapshot,
    gameService,

    // Connection management

    // Methods
    initializeConnection,
    setGameData,
  };
});
