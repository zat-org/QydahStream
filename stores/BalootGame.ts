import { defineStore } from "pinia";
import type { GameDataI, GameI, IStatics, SakkaI } from "~/models/game";
import type { BoardSettingsI } from "~/models/boardSettings";
import { interpret } from "xstate";
import {
  createGameConnection,
  parseEvents,
} from "~/utils/connection";
import { pushClientErrorFromUnknown } from "~/utils/client-error-log";
import { logTypeForGameEvents, pushLog } from "~/utils/firebase-logger";

/** Compact + useful fields for RTDB debug_logs (full sakkas can be huge). */
function gameSnapshotForLog(g: GameDataI | null | undefined) {
  if (!g) return null;
  const last = g.sakkas?.[g.sakkas.length - 1];
  return {
    state: g.state,
    usName: g.usName,
    themName: g.themName,
    usGameScore: g.usGameScore,
    themGameScore: g.themGameScore,
    winner: g.winner ?? null,
    sakkaCount: g.sakkas?.length ?? 0,
    lastSakka: last
      ? {
          usSakkaScore: last.usSakkaScore,
          themSakkaScore: last.themSakkaScore,
          isMashdoda: last.isMashdoda,
          moshtaraCount: last.moshtaras?.length ?? 0,
          moshtaraStates: last.moshtaras?.map((m) => m.state) ?? [],
        }
      : null,
  };
}

function machineStateValue(snapshotLike: { value?: unknown; toStrings?: () => string[] }) {
  try {
    if (typeof snapshotLike.toStrings === "function") {
      return snapshotLike.toStrings();
    }
  } catch {
    /* ignore */
  }
  return snapshotLike.value ?? null;
}

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
  | "MaxSakkaCountChanged"
  | "GameContinuedFromBack";
export const useMyBalootGameStore = defineStore("myBalootGameStore", () => {
  const balootSocket = useRuntimeConfig().public.BalootSocket;
  const gameConnection = createGameConnection(balootSocket, {
    withCredentials: true,
    autoReconnect: true,
    maxReconnectAttempts: 5,
  });

  const sakka_ended = ref(false);
  const newGameFlag = ref(false);

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

    if (state.matches("score.intro")) {
      if (!newGame.value) return;
      game.value = newGame.value;
    }
  });

  const joinGameGroup = async (): Promise<GameI | null> => {
    const route = useRoute();
    const player_table_id = route.params.id?.toString();
    const table_id = route.params.table_id?.toString();
    const tour_id = route.params.tour_id?.toString();

    try {
      let gameData: string;

      const hasTournamentParams = table_id != null || tour_id != null;
      if (hasTournamentParams) {
        if (!table_id || !tour_id) {
          console.warn("Missing required tournament route params", {
            table_id,
            tour_id,
          });
          return null;
        }
        const tournamentId = Number(tour_id);
        const tournamentTableId = Number(table_id);
        if (
          !Number.isInteger(tournamentId) ||
          !Number.isInteger(tournamentTableId) ||
          tournamentId <= 0 ||
          tournamentTableId <= 0
        ) {
          console.warn("Invalid tournament route params", {
            table_id,
            tour_id,
          });
          return null;
        }
        // tournament table
        const { hasData, game } = await gameConnection.joinTournamentTableGroup(
          tournamentId,
          tournamentTableId,
        );
        gameData = game;
        if (!hasData) return null;
      } else {
        if (!player_table_id?.trim()) {
          console.warn("Missing board route param id");
          return null;
        }
        // board table
        const { hasData, game } =
          await gameConnection.joinBoardGroup(player_table_id);
        gameData = game;
        if (!hasData) return null;
      }

      if (gameData) {
        const parsedGame = JSON.parse(gameData) as GameI;
        parsedGame.gameData = sakkaIsMashdoda(parsedGame.gameData) as GameDataI;
        void pushLog({
          type: "join",
          level: "info",
          message: "Joined baloot board group",
          game: "baloot",
          payload: { hasData: true, gameId: parsedGame.gameData?.id },
        });
        return parsedGame;
      }
    } catch (error) {
      console.error("Failed to join game group:", error);
      if (import.meta.client) {
        pushClientErrorFromUnknown("baloot_store", error, {
          phase: "joinGameGroup",
        });
      }
      throw error;
    }

    void pushLog({
      type: "join",
      level: "warn",
      message: "Joined baloot group but no game data",
      game: "baloot",
    });
    return null;
  };

  const balootHubListenersAttached = ref(false);
  const setupBalootEventListenersOnce = () => {
    if (balootHubListenersAttached.value) return;
    const connection = gameConnection.rawConnection;
    connection.off("BalootGameStateChanged");
    connection.off("BalootBoardSettingsChanged");
    connection.on("BalootGameStateChanged", handleGameStateChanged);
    connection.on(
      "BalootBoardSettingsChanged",
      handleBalootBoardSettingsChanged,
    );
    balootHubListenersAttached.value = true;
  };

  const handleBalootBoardSettingsChanged = (_boardSettings: any) => {
    try {
      _boardSettings = JSON.parse(_boardSettings) as BoardSettingsI;
    } catch (error) {
      console.warn("Failed to parse board settings payload:", error);
      return;
    }

    // More detailed validation
    if (!_boardSettings) {
      console.warn("Board settings is null or undefined");
      return;
    }

    if (!_boardSettings.portrait) {
      console.warn("Board settings missing portrait property:", _boardSettings);
      return;
    }

    if (
      !_boardSettings.portrait.dimension ||
      !_boardSettings.portrait.scorePanel
    ) {
      console.warn(
        "Board settings missing required portrait properties:",
        _boardSettings.portrait,
      );
      return;
    }

    // Data is valid, update it
    console.log("Valid board settings received, updating...");
    boardSettings.value = _boardSettings;
  };
  const syncLastError = ref<string | null>(null);
  let syncInFlight: Promise<void> | null = null;

  async function syncBoardForCurrentRoute() {
    if (syncInFlight) return syncInFlight;

    syncInFlight = (async () => {
      syncLastError.value = null;
      try {
        await gameConnection.ensureConnected();
        setupBalootEventListenersOnce();
        const initialGame = await joinGameGroup();
        if (initialGame) {
          game.value = initialGame.gameData;
          boardSettings.value = initialGame.boardSettings;
        }
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : "syncBoardForCurrentRoute failed";
        syncLastError.value = msg;
        console.error("Failed to sync baloot board:", error);
        if (import.meta.client) {
          pushClientErrorFromUnknown("baloot_store", error, {
            phase: "syncBoardForCurrentRoute",
          });
        }
        throw error;
      } finally {
        syncInFlight = null;
      }
    })();

    return syncInFlight;
  }

  // After SignalR auto/manual reconnect, re-join the group and pull latest snapshot.
  gameConnection.onReconnected(() => {
    console.log("Baloot hub reconnected — re-joining group + fetching latest data");
    void syncBoardForCurrentRoute().catch(() => {
      /* syncLastError already set */
    });
  });

  async function initializeConnection() {
    await syncBoardForCurrentRoute();
  }

  const resetState = () => {
    newGameFlag.value = false;
    sakka_ended.value = false;
  };

  const handleStateSpecificEvents = () => {
    const currentState = snapshot.value;
    const machineState = machineStateValue(currentState);

    if (currentState.matches("detail")) {
      void pushLog({
        type: "game_event",
        level: "info",
        message: "handler: handelDetail",
        game: "baloot",
        payload: { machineState, events: [...events] },
      });
      handelDetail();
    } else if (currentState.matches("winner")) {
      void pushLog({
        type: "game_event",
        level: "info",
        message: "handler: handelWinner (noop)",
        game: "baloot",
        payload: { machineState, events: [...events] },
      });
      handelWinner();
    } else if (currentState.matches("statics")) {
      void pushLog({
        type: "game_event",
        level: "info",
        message: "handler: handelStatics (noop)",
        game: "baloot",
        payload: { machineState, events: [...events] },
      });
      handelStatics();
    } else if (currentState.matches("score")) {
      const onMain = currentState.matches("score.main");
      const onIntro = currentState.matches("score.intro");
      // intro + main: apply data. Only main may start outro→detail (ScoreIncreased).
      if (onMain || onIntro) {
        void pushLog({
          type: "game_event",
          level: "info",
          message: onMain
            ? "handler: handelScore (score.main)"
            : "handler: handelScore (score.intro — data only, no TO_OUTRO)",
          game: "baloot",
          payload: {
            machineState,
            events: [...events],
            gameBefore: gameSnapshotForLog(game.value),
            newGame: gameSnapshotForLog(newGame.value),
          },
        });
        handelScore({ allowFlowTransitions: onMain });
        void pushLog({
          type: "game_event",
          level: "info",
          message: "handler: handelScore done",
          game: "baloot",
          payload: {
            machineState,
            events: [...events],
            gameAfter: gameSnapshotForLog(game.value),
          },
        });
      } else {
        // score.outro — still refresh data for new game / decrease; never TO_OUTRO
        void pushLog({
          type: "game_event",
          level: "info",
          message: "handler: handelScore (score.outro — data only)",
          game: "baloot",
          payload: {
            machineState,
            events: [...events],
            gameBefore: gameSnapshotForLog(game.value),
            newGame: gameSnapshotForLog(newGame.value),
          },
        });
        handelScore({ allowFlowTransitions: false });
      }
    } else {
      void pushLog({
        type: "game_event",
        level: "warn",
        message: "handler SKIPPED — machine not on score/detail/statics/winner",
        game: "baloot",
        payload: {
          machineState,
          events: [...events],
          newGame: gameSnapshotForLog(newGame.value),
        },
      });
    }
  };
  const handleSpecialEvents = () => {
    if (events.includes("SakkaEnded")) {
      game.value = newGame.value;
      handelSakkaEnded();
      void pushLog({
        type: "game_event",
        level: "info",
        message: "special: SakkaEnded → game=newGame + handelSakkaEnded",
        game: "baloot",
        payload: { gameAfter: gameSnapshotForLog(game.value) },
      });
    }

    // New game / new sakka while idle on score: always sync store (no TO_OUTRO).
    const newGameBundle: BalootGameEvent[] = [
      "GameStarted",
      "NamesChanged",
      "MaxSakkaCountChanged",
      "IsCurrentSakkaMashdodaChanged",
      "SakkaStarted",
    ];
    const isNewGameBundle = newGameBundle.every((e) => events.includes(e));
    const isSakkaStartOnly =
      events.includes("SakkaStarted") &&
      !events.includes("ScoreIncreased") &&
      !events.includes("SakkaEnded");

    if (
      newGame.value &&
      snapshot.value.matches("score") &&
      (isNewGameBundle || isSakkaStartOnly)
    ) {
      game.value = newGame.value;
      void pushLog({
        type: "game_event",
        level: "info",
        message: isNewGameBundle
          ? "special: new-game bundle → game=newGame (stay on score)"
          : "special: SakkaStarted → game=newGame (stay on score)",
        game: "baloot",
        payload: {
          machineState: machineStateValue(snapshot.value),
          gameAfter: gameSnapshotForLog(game.value),
        },
      });
    } else if (events.includes("SakkaStarted")) {
      console.log("Sakka started");
      void pushLog({
        type: "game_event",
        level: "info",
        message:
          "special: SakkaStarted (no score assign — not on score or bundled with score flow)",
        game: "baloot",
        payload: {
          machineState: machineStateValue(snapshot.value),
          newGame: gameSnapshotForLog(newGame.value),
          game: gameSnapshotForLog(game.value),
        },
      });
    }

    if (events.includes("GameEnded")) {
      game.value = newGame.value;
      handelGameEnded();
    }
    if (events.includes("NamesChanged") && events.length == 1) {
      if (!game.value || !newGame.value) return;
      game.value.themName = newGame.value.themName;
      game.value.usName = newGame.value.usName;
      game.value.themPlayers = newGame.value.themPlayers;
      game.value.usPlayers = newGame.value.usPlayers;
    }
  };

  const handleGameStateChanged = (
    _events: any,
    _gamedata: any,
    _statics: any,
  ) => {
    try {
      resetState();

      // CRITICAL: Update snapshot to get current state machine state
      snapshot.value = gameService.getSnapshot();

      events = parseEvents<BalootGameEvent>(_events);

      const machineStateBefore = machineStateValue(snapshot.value);
      let parsedOk = false;
      let parseError: string | null = null;

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
        parsedOk = true;
      } catch (error) {
        parseError = error instanceof Error ? error.message : String(error);
        console.error("Failed to parse game data:", error);
        void pushLog({
          type: "error",
          level: "error",
          message: "BalootGameStateChanged: failed to parse _gamedata",
          game: "baloot",
          payload: {
            events,
            machineState: machineStateBefore,
            parseError,
            gamedataPreview:
              typeof _gamedata === "string"
                ? _gamedata.slice(0, 500)
                : String(_gamedata),
          },
        });
        return;
      }

      // Hub WS payload + current machine state (for /log RTDB)
      void pushLog({
        type: logTypeForGameEvents(events),
        level: "info",
        message: `BalootGameStateChanged: ${events.join(",") || "(none)"}`,
        game: "baloot",
        payload: {
          events,
          machineState: machineStateBefore,
          parsedOk,
          gameBefore: gameSnapshotForLog(game.value),
          /** Data that just arrived from SignalR (after mashdoda normalize). */
          wsGame: gameSnapshotForLog(newGame.value),
          /** Raw string length / preview if you need deeper inspect. */
          wsGamedataChars:
            typeof _gamedata === "string" ? _gamedata.length : null,
          wsGamedataPreview:
            typeof _gamedata === "string" ? _gamedata.slice(0, 1500) : null,
          hasStatics: Boolean(_statics),
        },
      });

      handleStateSpecificEvents();

      handleSpecialEvents();
    } catch (error) {
      console.error("Error in handleGameStateChanged:", error);
      void pushLog({
        type: "error",
        level: "error",
        message: "BalootGameStateChanged: uncaught error",
        game: "baloot",
        payload: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  };

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
      if (!game.value || !newGame.value) return;
      gameService.send({ type: "UPDATE_CONTEXT", ended: null });
      game.value.sakkas = newGame.value.sakkas;
    }
    if (events.includes("ScoreIncreased") && newGame.value?.winner == null) {
      if (!game.value || !newGame.value) return;
      game.value.sakkas = newGame.value.sakkas;
    }
  };
  const handelWinner = () => {};
  const handelStatics = () => {};

  const handelScore = (opts: { allowFlowTransitions?: boolean } = {}) => {
    const allowFlow = opts.allowFlowTransitions !== false;

    if (events.includes("NamesChanged") && events.length == 1) {
      if (!game.value || !newGame.value) return;
      game.value.themName = newGame.value.themName;
      game.value.usName = newGame.value.usName;
      game.value.themPlayers = newGame.value.themPlayers;
      game.value.usPlayers = newGame.value.usPlayers;
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
      void pushLog({
        type: "game_event",
        level: "info",
        message: "handelScore: applied FULL newGame (5-event new-game bundle)",
        game: "baloot",
        payload: { gameAfter: gameSnapshotForLog(game.value) },
      });
    }
    if (events.includes("IsCurrentSakkaMashdodaChanged")) {
      game.value = newGame.value;
      void pushLog({
        type: "game_event",
        level: "info",
        message: "handelScore: applied FULL newGame (IsCurrentSakkaMashdodaChanged)",
        game: "baloot",
        payload: { gameAfter: gameSnapshotForLog(game.value) },
      });
    }

    if (events.includes("ScoreIncreased")) {
      // Keep normal stream flow: only leave score → detail from score.main
      if (allowFlow) {
        gameService.send({ type: "TO_OUTRO" });
      }
      const gameedndedevents: BalootGameEvent[] = ["SakkaEnded", "GameEnded"];
      if (gameedndedevents.every((event) => events.includes(event))) {
        game.value = newGame.value;
        void pushLog({
          type: "score",
          level: "info",
          message:
            "handelScore: ScoreIncreased → TO_OUTRO + full game (SakkaEnded+GameEnded)",
          game: "baloot",
          payload: {
            allowFlow,
            gameAfter: gameSnapshotForLog(game.value),
          },
        });
      } else {
        if (!game.value || !newGame.value) return;
        game.value.sakkas = newGame.value.sakkas;
        void pushLog({
          type: "score",
          level: "info",
          message: allowFlow
            ? "handelScore: ScoreIncreased → TO_OUTRO + sakkas only"
            : "handelScore: ScoreIncreased → sakkas only (no TO_OUTRO)",
          game: "baloot",
          payload: {
            allowFlow,
            gameAfter: gameSnapshotForLog(game.value),
            newGame: gameSnapshotForLog(newGame.value),
          },
        });
      }
    }
    if (events.includes("ScoreUpdated") && newGame.value?.winner !== null) {
      if (allowFlow) {
        gameService.send({ type: "TO_OUTRO" });
      }
      game.value = newGame.value;
    }

    if (events.includes("ScoreUpdated") || events.includes("ScoreDecreased")) {
      if (!game.value || !newGame.value) return;
      game.value.sakkas = newGame.value.sakkas;
      void pushLog({
        type: "score",
        level: "info",
        message: "handelScore: ScoreUpdated/Decreased → sakkas synced (stay on score)",
        game: "baloot",
        payload: { gameAfter: gameSnapshotForLog(game.value) },
      });
    }
    const contimuefrombackEvents: BalootGameEvent[] = [
      "ScoreDecreased",
      "GameContinuedFromBack",
    ];
    if (contimuefrombackEvents.every((event) => events.includes(event))) {
      game.value = newGame.value;
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

  // players images - using computed properties
  const top = computed(() => {
    const usPlayer0 = game.value?.usPlayers?.[0];
    if (usPlayer0 && usPlayer0.url) {
      return {
        id: usPlayer0.id,
        name: usPlayer0.name,
        url: usPlayer0.url,
        index: usPlayer0.index,
      };
    }
    return undefined;
  });

  const bottom = computed(() => {
    const usPlayer1 = game.value?.usPlayers?.[1];
    if (usPlayer1 && usPlayer1.url) {
      return {
        id: usPlayer1.id,
        name: usPlayer1.name,
        url: usPlayer1.url,
        index: usPlayer1.index,
      };
    }
    return undefined;
  });

  const left = computed(() => {
    const themPlayer1 = game.value?.themPlayers?.[1];
    if (themPlayer1 && themPlayer1.url) {
      return {
        id: themPlayer1.id,
        name: themPlayer1.name,
        url: themPlayer1.url,
        index: themPlayer1.index,
      };
    }
    return undefined;
  });

  const right = computed(() => {
    const themPlayer0 = game.value?.themPlayers?.[0];
    if (themPlayer0 && themPlayer0.url) {
      return {
        id: themPlayer0.id,
        name: themPlayer0.name,
        url: themPlayer0.url,
        index: themPlayer0.index,
      };
    }
    return undefined;
  });

  const themName = computed(() => {
    return game.value?.themName
      ? game.value?.themName
      : game.value?.themPlayers.length == 0
        ? "لهم"
        : game.value?.themPlayers[0].name +
          " | " +
          game.value?.themPlayers[1].name;
  });

  const usName = computed(() => {
    return game.value?.usName
      ? game.value?.usName
      : game.value?.usPlayers.length == 0
        ? "لنا"
        : game.value?.usPlayers[0].name + " | " + game.value?.usPlayers[1].name;
  });
  const BoardStyles = ref({
    dimension: {
      height: "1920px",
      width: "1080px",
    },
    scorePanel: {
      "margin-top": "0px",
      left: "0px",
      top: "0px",
      height: "295px",
      scale: 0.9,
      leftTeam: {
        name: {
          transform: `translate(0px,0px)`,
          "font-size": "30px",
        },
        score: {
          transform: `translate(0px,0px)`,
          "font-size": "50px",
        },
      },
      rightTeam: {
        name: {
          transform: `translate(0px,0px)`,
          "font-size": "30px",
        },
        score: {
          transform: `translate(0px,0px)`,
          "font-size": "50px",
        },
      },
    },
    leftPlayer: {
      top: "calc(50% - 100px)",
      left: "0px",
      height: "200px",
      width: "200px",
    },
    rightPlayer: {
      top: "calc(50% - 100px)",
      right: "0px",
      height: "200px",
      width: "200px",
    },
    bottomPlayer: {
      left: "calc(50% - 100px)",
      bottom: "0px",
      height: "200px",
      width: "200px",
    },
    detailScore: {
      color: "#000000",
      "font-size": "70px",
    },
    playerImageWidth: "200px",
  });
  watch(
    boardSettings,
    (newVal) => {
      // console.log(" ____ boardSettings ____", newVal);
      const portraitBoardSettings = boardSettings.value?.portrait;
      if (!portraitBoardSettings) {
        // console.log(" ____ portraitBoardSettings ____", portraitBoardSettings);
        return;
      }

      // Use Object.assign to maintain reactivity
      Object.assign(BoardStyles.value, {
        dimension: {
          height: portraitBoardSettings.dimension.height + "px",
          width: portraitBoardSettings.dimension.width + "px",
        },

        scorePanel: {
          "margin-top": portraitBoardSettings.scorePanel.topMargin + "px",
          left: portraitBoardSettings.scorePanel.position.left + "px",
          top: portraitBoardSettings.scorePanel.position.top + "px",
          height: portraitBoardSettings.scorePanel.height + "px",
          scale: portraitBoardSettings.scorePanel.position.scale,
          leftTeam: {
            name: {
              transform: `translate(${portraitBoardSettings.scorePanel.leftTeam.name.left}px, ${portraitBoardSettings.scorePanel.leftTeam.name.top}px)`,
              "font-size":
                portraitBoardSettings.scorePanel.leftTeam.name.size + "px",
            },
            score: {
              transform: `translate(${portraitBoardSettings.scorePanel.leftTeam.score.left}px,${portraitBoardSettings.scorePanel.leftTeam.score.top}px)`,
              "font-size":
                portraitBoardSettings.scorePanel.leftTeam.score.size + "px",
            },
          },
          rightTeam: {
            name: {
              transform: `translate(${portraitBoardSettings.scorePanel.rightTeam.name.left}px, ${portraitBoardSettings.scorePanel.rightTeam.name.top}px)`,
              "font-size":
                portraitBoardSettings.scorePanel.rightTeam.name.size + "px",
            },
            score: {
              transform: `translate(${portraitBoardSettings.scorePanel.rightTeam.score.left}px,${portraitBoardSettings.scorePanel.rightTeam.score.top}px)`,
              "font-size":
                portraitBoardSettings.scorePanel.rightTeam.score.size + "px",
            },
          },
        },
        leftPlayer: {
          top: `calc(50% - ${(portraitBoardSettings.playerImageWidth ?? 200) / 2}px  + ${portraitBoardSettings.leftPlayer.top}px )`,
          left: `${portraitBoardSettings.leftPlayer.left}px`,
          height: `${portraitBoardSettings.playerImageWidth}px`,
          width: `${portraitBoardSettings.playerImageWidth}px`,
        },
        rightPlayer: {
          top: `calc(50% - ${(portraitBoardSettings.playerImageWidth ?? 200) / 2}px + ${portraitBoardSettings.rightPlayer.top}px )`,
          right: `${portraitBoardSettings.rightPlayer.right}px`,
          height: `${portraitBoardSettings.playerImageWidth}px`,
          width: `${portraitBoardSettings.playerImageWidth}px`,
        },
        bottomPlayer: {
          left: `calc(50% - ${(portraitBoardSettings.playerImageWidth ?? 200) / 2}px + ${portraitBoardSettings.bottomPlayer.left}px )`,
          bottom: `${portraitBoardSettings.bottomPlayer.bottom}px`,
          height: `${portraitBoardSettings.playerImageWidth}px`,
          width: `${portraitBoardSettings.playerImageWidth}px`,
        },
        detailScore: {
          color: portraitBoardSettings.detailScore.color,
          "font-size": portraitBoardSettings.detailScore.fontSize + "px",
        },
        playerImageWidth: `${portraitBoardSettings.playerImageWidth ?? 200}px`,
      });

      console.log("data of BoardStyles", BoardStyles.value);
    },
    { deep: true, immediate: true },
  );

  const last_sakka = computed<SakkaI | undefined>(() => {
    return game.value?.sakkas[game.value?.sakkas.length! - 1];
  });

  const ended_moshtras = computed(() => {
    return last_sakka.value?.moshtaras.filter((m) => {
      return m.state == "Ended";
    });
  });

  const gameState = computed(() => {
    return game.value?.state;
  });

  const usGameScore = computed(() => {
    return game.value?.usGameScore;
  });

  const themGameScore = computed(() => {
    return game.value?.themGameScore;
  });

  const statusUs = computed(() => {
    if (statics.value) return statics.value.usStatistics;
  });
  const statusThem = computed(() => {
    if (statics.value) return statics.value.themStatistics;
  });

  const winner = computed(() => {
    if (game?.value?.winner) {
      if (game.value.winner == "Us") {
        return {
          players:
            game.value.usPlayers.length > 0 ? game.value.usPlayers : null,
          name: game.value.usName,
          type: "Us",
        };
      } else {
        return {
          players:
            game.value.themPlayers.length > 0 ? game.value.themPlayers : null,
          name: game.value.themName,
          type: "Them",
        };
      }
    }
  });

  return {
    game: game,
    boardSettings: boardSettings,
    statics,
    snapshot,
    gameService,

    //data to repersent
    top,
    bottom,
    left,
    right,
    themName,
    usName,
    BoardStyles,
    last_sakka,
    ended_moshtras,
    gameState,
    usGameScore,
    themGameScore,
    statusUs,
    statusThem,
    winner,
    // connection
    initializeConnection,
    syncBoardForCurrentRoute,
    syncLastError,
    hubConnectionState: gameConnection.connectionState,
    hubConnectionError: gameConnection.connectionError,

    // set data for index page
    setGameData,
  };
});
