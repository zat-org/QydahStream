import { defineStore } from "pinia";
import * as signalR from "@microsoft/signalr";
import type { GameI, IStatics } from "~/models/game";
import { interpret } from "xstate";

// Event types for better type safety
type GameEvent = 
  | "GameStarted" 
  | "GameEnded" 
  | "SakkaEnded" 
  | "SakkaStarted" 
  | "ScoreIncreased" 
  | "ScoreDecreased" 
  | "ScoreUpdated" 
  | "NamesChanged" 
  | "IsCurrentSakkaMashdodaChanged";

interface GameStateChangedData {
  eventName: string;
  gameData: string;
  gameStatics?: string;
}

// Connection states
enum ConnectionState {
  Disconnected = "Disconnected",
  Connecting = "Connecting", 
  Connected = "Connected",
  Reconnecting = "Reconnecting",
  Failed = "Failed"
}
export const useMyGameStore = defineStore("myGameStore", () => {

  const config = useRuntimeConfig();

  // Connection state management
  const connectionState = ref<ConnectionState>(ConnectionState.Disconnected);
  const connectionError = ref<string | null>(null);
  const reconnectAttempts = ref(0);
  const maxReconnectAttempts = 5;
  
  const sakka_ended = ref(false);
  // use to make score show 0 when new game start
  const newGameFlag = ref(false);

  // use to change data in  score
  // increase and decrese score
  // and change from mashdoda to not
  const game_updated = ref(false);

  const statics = ref<IStatics>();
  const game = ref<GameI>()!;
  const newGame = ref<GameI>()!;

  let events: GameEvent[] = [];

  // Remove unused variables - events are checked inline where needed

  const { gameMachine } = useNashraMachine();
  const gameService = interpret(gameMachine).start();
  const snapshot = ref(gameService.getSnapshot());

  gameService.subscribe((state) => {
    snapshot.value = state;
    if (
      snapshot.value.matches("score.intro") &&
      newGame.value &&
      game.value &&
      (newGame.value.gameData.id !== game.value.gameData.id || sakka_ended.value)
    ) {
      console.log("game change in watch state ");
      game.value = newGame.value;
    }
  });

  // Create connection with enhanced configuration
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(config.public.qydhaapi, {
      withCredentials: true,
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: retryContext => {
        if (retryContext.previousRetryCount === 0) {
          return 0;
        }
        return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
      }
    })
    .configureLogging(signalR.LogLevel.Information)
    .build();

  // Connection event handlers
  connection.onclose((error) => {
    connectionState.value = ConnectionState.Disconnected;
    if (error) {
      connectionError.value = error.message;
      console.error("Connection closed due to error:", error);
    } else {
      console.log("Connection closed");
    }
  });

  connection.onreconnecting((error) => {
    connectionState.value = ConnectionState.Reconnecting;
    reconnectAttempts.value++;
    console.log("Attempting to reconnect...", { attempt: reconnectAttempts.value, error });
  });

  connection.onreconnected((connectionId) => {
    connectionState.value = ConnectionState.Connected;
    connectionError.value = null;
    reconnectAttempts.value = 0;
    console.log("Reconnected successfully:", connectionId);
  });

  // Parse and validate events from server
  const parseEvents = (eventName: string): GameEvent[] => {
    try {
      return eventName
        .split(",")
        .map(e => e.trim() as GameEvent)
        .filter(e => e); // Remove empty strings
    } catch (error) {
      console.error("Failed to parse events:", error);
      return [];
    }
  };

  // Enhanced game state change handler
  const handleGameStateChanged = (data: GameStateChangedData) => {
    try {
      // Reset flags
      newGameFlag.value = false;
      game_updated.value = false;
      sakka_ended.value = false;

      // Parse events
      events = parseEvents(data.eventName);
      console.log("Received events:", events);

      // Update flags based on events
      newGameFlag.value = events.includes("GameStarted");

      // Handle statistics
      if (data.gameStatics) {
        try {
          statics.value = JSON.parse(data.gameStatics) as IStatics;
          console.log("Updated statistics:", statics.value);
        } catch (error) {
          console.error("Failed to parse game statistics:", error);
        }
      }

      // Handle game data
      try {
        const parsedNewGame = JSON.parse(data.gameData) as GameI;
        newGame.value = sakkaIsMashdoda(parsedNewGame);
        console.log("Updated game data:", newGame.value);
      } catch (error) {
        console.error("Failed to parse game data:", error);
        return;
      }

      // Handle state-specific logic
      handleStateSpecificEvents();

      // Handle special events
      handleSpecialEvents();

    } catch (error) {
      console.error("Error in handleGameStateChanged:", error);
    }
  };

  // Handle events based on current state machine state
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

  // Setup SignalR event listeners
  const setupEventListeners = () => {
    connection.on("BalootGameStateChanged", handleGameStateChanged);
    
    // Add other event listeners as needed
    connection.on("ConnectionError", (error: string) => {
      console.error("Server reported connection error:", error);
      connectionError.value = error;
    });
  };

  // Join appropriate game group based on route
  const joinGameGroup = async (): Promise<GameI | null> => {
    const route = useRoute();
    const player_table_id = route.params.id?.toString();
    const table_id = route.params.table_id?.toString();
    const tour_id = route.params.tour_id?.toString();

    try {
      let gameData: string;
      
      if (table_id && tour_id) {
        console.log("Joining tournament table group:", { tour_id, table_id });
        gameData = await connection.invoke(
          "AddToTournamentTableGroup",
          +tour_id,
          +table_id
        );
      } else {
        console.log("Joining board group:", { player_table_id });
        gameData = await connection.invoke("AddToBoardGroup", player_table_id);
      }

      if (gameData) {
        const parsedGame = JSON.parse(gameData) as GameI;
        return sakkaIsMashdoda(parsedGame);
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
      connectionState.value = ConnectionState.Connecting;
      connectionError.value = null;

      await connection.start();
      connectionState.value = ConnectionState.Connected;
      console.log("SignalR connection established");

      // Setup event listeners
      setupEventListeners();

      // Join appropriate game group and get initial game state
      const initialGame = await joinGameGroup();
      if (initialGame) {
        game.value = initialGame;
        console.log("Initial game state loaded:", game.value);
      }

    } catch (error) {
      connectionState.value = ConnectionState.Failed;
      connectionError.value = error instanceof Error ? error.message : "Connection failed";
      console.error("Failed to initialize connection:", error);
      throw error;
    }
  }

  const sakkaIsMashdoda = (game: GameI): GameI => {
    if (game.gameData.sakkas.length <= 0) return game;
    const lastSakka = game.gameData.sakkas[game.gameData.sakkas.length - 1];
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
      if (events.includes("ScoreDecreased") && newGame.value?.gameData.winner == null) {
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
      if (events.includes("ScoreUpdated") && newGame.value?.gameData.winner !== null) {
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
      game?.value?.gameData.usPlayers.length > 0 &&
      game?.value?.gameData.usPlayers[0].url &&
      game?.value?.gameData.usPlayers[1].url;
    const them_photo =
      game?.value &&
      game?.value?.gameData.themPlayers.length > 0 &&
      game?.value?.gameData.themPlayers[0].url &&
      game?.value?.gameData.themPlayers[1].url;

    if (game?.value?.gameData.winner) {
      if (game?.value?.gameData.winner == "Us" && us_photo) {
        winner = true;
      } else if (game?.value?.gameData.winner == "Them" && them_photo) {
        winner = true;
      }
    }

    gameService.send({ type: "UPDATE_CONTEXT", ended: winner });
  };
  // to show statics
  const handelSakkaEnded = () => {
    sakka_ended.value = true;
    if (statics.value) {
      const advanced_write = game.value?.gameData.sakkas[
        game.value?.gameData.sakkas.length - 1
      ].moshtaras.every((m) => {
        return m.advancedDetails != null;
      });

      console.log("show statistics", advanced_write);
      // let moshtraCount =
      //   statics.value?.themStatistics.moshtaraHokmCount +
      //   statics.value?.themStatistics.moshtaraSunCount +
      //   statics.value?.usStatistics.moshtaraHokmCount +
      //   statics.value?.usStatistics.moshtaraSunCount;
      // console.log("mostracount ", moshtraCount);
      if (advanced_write) {
        gameService.send({ type: "UPDATE_ENDSAKKA", sakkaended: true });
      }
    }
  };

  // Manual reconnection function
  const reconnect = async () => {
    if (connectionState.value === ConnectionState.Connecting || 
        connectionState.value === ConnectionState.Reconnecting) {
      console.log("Connection already in progress");
      return;
    }

    try {
      connectionState.value = ConnectionState.Reconnecting;
      await connection.stop();
      await connection.start();
      connectionState.value = ConnectionState.Connected;
      console.log("Manual reconnection successful");
      
      // Rejoin game group after reconnection
      const gameData = await joinGameGroup();
      if (gameData) {
        game.value = gameData;
      }
    } catch (error) {
      connectionState.value = ConnectionState.Failed;
      connectionError.value = error instanceof Error ? error.message : "Reconnection failed";
      console.error("Manual reconnection failed:", error);
      throw error;
    }
  };

  // Cleanup function for when component unmounts
  const cleanup = async () => {
    try {
      if (connection.state === signalR.HubConnectionState.Connected) {
        await connection.stop();
      }
      connectionState.value = ConnectionState.Disconnected;
      console.log("Connection cleaned up");
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  };

  // Check connection health
  const isConnected = computed(() => 
    connectionState.value === ConnectionState.Connected
  );

  const isConnecting = computed(() => 
    connectionState.value === ConnectionState.Connecting || 
    connectionState.value === ConnectionState.Reconnecting
  );

  return {
    // Existing reactive data
    game_updated,
    newGameFlag,
    sakka_ended,
    game: computed(() => game.value?.gameData),
    boardSettings: computed(() => game.value?.boardSettings),
    statics,
    snapshot,
    gameService,
    
    // Connection management
    connection,
    connectionState: readonly(connectionState),
    connectionError: readonly(connectionError),
    reconnectAttempts: readonly(reconnectAttempts),
    isConnected,
    isConnecting,
    
    // Methods
    initializeConnection,
    reconnect,
    cleanup,
  };
});
