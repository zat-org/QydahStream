import { defineStore } from "pinia";
import type { BoardSettingsI, GameDataI, GameI, IStatics } from "~/models/game";
import { interpret } from "xstate";
import { 
  createGameConnection, 
  parseEvents, 
  type GameConnection, 
  ConnectionState 
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
  | "IsCurrentSakkaMashdodaChanged";
export const useMyHandGameStore = defineStore("myHandGameStore", () => {

  const handSocket = useRuntimeConfig().public.HandSocket;

  // Create connection instance
  const gameConnection = createGameConnection(handSocket, {
    withCredentials: true,
    autoReconnect: true,
    maxReconnectAttempts: 5
  });
  

  const sakka_ended = ref(false);
  const newGameFlag = ref(false);
  const game_updated = ref(false);
  const statics = ref<IStatics>();
  const game = ref<GameDataI>()!;
  const boardSettings = ref<BoardSettingsI>()!;
  const newGame = ref<GameDataI>()!;

  let events: BalootGameEvent[] = [];


  const { gameMachine } = useNashraMachine();
  const gameService = interpret(gameMachine).start();
  const snapshot = ref(gameService.getSnapshot());

  gameService.subscribe((state) => {
    snapshot.value = state;
    if (
      snapshot.value.matches("score.intro") &&
      newGame.value &&
      game.value &&
      (newGame.value.id !== game.value.id || sakka_ended.value)
    ) {
      console.log("game change in watch state ");
      game.value = newGame.value;
    }
  });


  const handleGameStateChanged = (_events:any, _gamedata:any, _statics:any) => {
   
    try {

      newGameFlag.value = false;
      game_updated.value = false;
      sakka_ended.value = false;

      events = parseEvents<BalootGameEvent>(_events);
      console.log("Received events:", events);
      newGameFlag.value = events.includes("GameStarted");

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
        // console.log("parsedNewGame", parsedNewGame);
        newGame.value = sakkaIsMashdoda(parsedNewGame) as GameDataI;
        // console.log("Updated game data:", newGame.value);
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
    } else if (currentState.matches("score.main")) {
      handelScore();
    }
  };

  // Handle special events that can occur in any state
  const handleSpecialEvents = () => {
    if (events.includes("SakkaEnded")) {
      handelSakkaEnded();
    }
    
    if (events.includes("SakkaStarted")) {
      console.log("Sakka started");
      // Add any sakka start logic here
    }

    if (events.includes("GameEnded")) {
      handelGameEnded();
    }
  };

  // Event listeners are now handled by the GameConnection class

  
  const joinGameGroup = async (): Promise<GameDataI | null> => {
    const route = useRoute();
    const player_table_id = route.params.id?.toString();
    const table_id = route.params.table_id?.toString();
    const tour_id = route.params.tour_id?.toString();

    try {
      let gameData: string;
      if (table_id && tour_id) {
        // tournament table
        gameData = await gameConnection.joinTournamentTableGroup(+tour_id, +table_id);
      } else {
        // board table
        gameData = await gameConnection.joinBoardGroup(player_table_id!);
      }

      if (gameData) {
        const parsedGame = JSON.parse(gameData) as GameDataI;
        return sakkaIsMashdoda(parsedGame) as GameDataI;
      }
    } catch (error) {
      console.error("Failed to join game group:", error);
      throw error;
    }
    
    return null;
  };

  // Main connection initialization function
  async function initializeConnection() {
    try {
      await gameConnection.initializeConnection();
      console.log("SignalR connection established");

      // Setup Baloot-specific event listeners after connection is established
      setupBalootEventListeners();

      // Join appropriate game group and get initial game state
      const initialGame = await joinGameGroup();
      if (initialGame) {
        game.value = initialGame;
        console.log("Initial game state loaded:", game.value);
      }

    } catch (error) {
      console.error("Failed to initialize connection:", error);
      throw error;
    }
  }

  const sakkaIsMashdoda = (game: GameDataI): GameDataI => {
    console.log("sakkaIsMashdoda", game.sakkas);
    if (game.sakkas.length <= 0) return game;
    const lastSakka = game.sakkas[game.sakkas.length - 1];
    if (lastSakka.isMashdoda) {
      // add mostra 50 - 50
      // add 50 to us and them in this score
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
    } else {
      // handele delete can be doing nothinng
    }

    // console.log("masdda", game);
    return game;
  };
  const handelDetail = () => {
    if (
      events.includes("GameStarted") ||
      events.includes("SakkaEnded") ||
      events.includes("SakkaStarted")
    ) {
      console.log(" new game start in detail");
      console.log(" or saka ended  in detail");
      console.log(" or saka  start in detail");
    } else {
      if (events.includes("ScoreDecreased") && newGame.value?.winner == null) {
        gameService.send({ type: "UPDATE_CONTEXT", ended: null });
      }
      if (!snapshot.value.context.ended) {
        game.value = newGame.value;
        console.log(
          "game changed  in detail in not new ggame stated and not sakka ended or started "
        );
      }
    }
  };
  const handelWinner = () => {};
  const handelStatics = () => {};
  const handelScore = () => {
    if (events.includes("NamesChanged") && events.length == 1) {
      console.log("game changed in score  in name changed ");
      game.value = newGame.value;
    }

    if (events.includes("GameStarted")) {
      // console.log("game changed in score  in start game  ")
      // game.value = newGame.value
    } else if (events.includes("ScoreIncreased")) {
      gameService.send({ type: "TO_OUTRO" });
      console.log("game changed in socre  score increase ");
      game.value = newGame.value;
    } else if (
      events.includes("ScoreUpdated") ||
      events.includes("ScoreDecreased")
    ) {
      if (events.includes("ScoreUpdated") && newGame.value?.winner !== null) {
        gameService.send({ type: "TO_OUTRO" });
      }
      console.log("game changed in socre  score increase 2");
      game.value = newGame.value;
      game_updated.value = true;
    } else if (events.includes("IsCurrentSakkaMashdodaChanged")) {
      console.log("game changed in score  IsCurrentSakkaMashdodaChanged");
      game.value = newGame.value;
      game_updated.value = true;
    } else {
    }
  };
  // to show  winner
  const handelGameEnded = () => {
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
    game:game,
    boardSettings:boardSettings,
    statics,
    snapshot,
    gameService,
    
    // Connection management
    
    // Methods
    initializeConnection,
    setGameData,
    
  };
});
