import { defineStore } from "pinia";
import type { IStatics } from "~/models/game";
import { interpret } from "xstate";
import {
  createGameConnection,
  parseEvents,
} from "~/utils/connection";
import { pushClientErrorFromUnknown } from "~/utils/client-error-log";
import { logTypeForGameEvents, pushLog } from "~/utils/firebase-logger";
import type { HandGameDataI } from "~/models/handGame";

type HandGameEvent =
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
export const useMyHandGameStore = defineStore("myHandGameStore", () => {
  const handSocket = useRuntimeConfig().public.HandSocket;

  // Create connection instance
  const gameConnection = createGameConnection(handSocket, {
    withCredentials: true,
    autoReconnect: true,
    maxReconnectAttempts: 5,
  });

  const gameEnd = ref(false);
  const statics = ref<IStatics>();
  const game = ref<HandGameDataI>()!;
  const newGame = ref<HandGameDataI>()!;

  let events: HandGameEvent[] = [];

  const { gameMachine } = useNashraMachine();
  const gameService = interpret(gameMachine).start();
  const snapshot = ref(gameService.getSnapshot());

  // State machine subscription with debugging
  gameService.subscribe((state) => {
    snapshot.value = state;
    // if (state.matches("detail.outro") && gameEnd.value) {
    //   game.value = newGame.value;
    //   console.log(winnerTeam.value);
    //   if (winnerTeam.value !== null) {
    //     let showWinner = winnerTeam.value?.players.every((p) => {
    //       return p.imageUrl != null;
    //     });
    //     console.log(showWinner);
    //     gameService.send({ type: "UPDATE_CONTEXT", ended: showWinner });
    //   }
    //   gameEnd.value = false;
    // }
    if (state.matches("score.intro")) {
      if (!newGame.value) return;
      game.value = newGame.value;
    }
    if (state.matches("detail.intro" )) {
      if (!game.value || !newGame.value) return;
      if (game.value.id == newGame.value.id) {
        game.value = newGame.value;
      }
    }
  });
  const resetState = () => {
    // newGameFlag.value = false;
    // sakka_ended.value = false;
    gameEnd.value = false;
  };

  const handleGameStateChanged = (
    _events: any,
    _gamedata: any,
    _statics: any
  ) => {
    try {
      resetState();
      // console.log("handleGameStateChanged", _events, _gamedata, _statics);
      // CRITICAL: Update snapshot to get current state machine state
      snapshot.value = gameService.getSnapshot();

      events = parseEvents<HandGameEvent>(_events);

      void pushLog({
        type: logTypeForGameEvents(events),
        level: "info",
        message: `handgamestatechanged: ${events.join(",") || "(none)"}`,
        game: "hand",
        payload: { events },
      });

      if (_statics) {
        try {
          statics.value = JSON.parse(_statics) as IStatics;
          console.log("Updated statistics:", statics.value);
        } catch (error) {
          console.error("Failed to parse game statistics:", error);
        }
      }

      try {
        const parsedNewGame = JSON.parse(_gamedata) as HandGameDataI;

        newGame.value = parsedNewGame;
        if (newGame.value.settings.zatMode == "WinWithZat") {
          // Sort: teams with hasZat === true come first, then by score ascending
          newGame.value.teams = parsedNewGame.teams.sort((a, b) => {
            if (a.hasZat === b.hasZat) {
              return a.score - b.score;
            }
            return (b.hasZat ? 1 : 0) - (a.hasZat ? 1 : 0);
            // Convert booleans to numbers for comparison: true (1) should come first
          });
        }else{
          newGame.value.teams = parsedNewGame.teams.sort(
            (a, b) => a.score - b.score
          );
        }
        // newGame.value = sakkaIsMashdoda(parsedNewGame) as GameDataI;
      } catch (error) {
        console.error("Failed to parse game data:", error);
        return;
      }
      console.log("newGame", newGame.value);
      handleSpecialEvents();
    } catch (error) {
      console.error("Error in handleGameStateChanged:", error);
    }
  };

  // Handle special events that can occur in any state
  const handleSpecialEvents = () => {
    if (snapshot.value.matches("score")) {
      handelScoreMain();
    }
    if (snapshot.value.matches("detail")) {
        handelDetailMain();      
    }
    
  };
  // Event listeners are now handled by the GameConnection class

  // join the match that wanted
  const joinGameGroup = async (): Promise<HandGameDataI | null> => {
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
          console.warn("Invalid tournament route params", { table_id, tour_id });
          return null;
        }
        // tournament table
        const {hasData, game} = await gameConnection.joinTournamentTableGroup(
          tournamentId,
          tournamentTableId
        );
        gameData = game;
        if(!hasData) return null;
      } else {
        if (!player_table_id?.trim()) {
          console.warn("Missing board route param id");
          return null;
        }
        // board table
        const {hasData, game} = await gameConnection.joinBoardGroup(player_table_id);
        gameData = game;
        if(!hasData) return null;
      }

      if (gameData) {
        const parsedGame = JSON.parse(gameData) as HandGameDataI;
        void pushLog({
          type: "join",
          level: "info",
          message: "Joined hand board group",
          game: "hand",
          payload: { hasData: true, gameId: parsedGame.id },
        });
        return parsedGame;
      }
    } catch (error) {
      console.error("Failed to join game group:", error);
      if (import.meta.client) {
        pushClientErrorFromUnknown("hand_store", error, {
          phase: "joinGameGroup",
        });
      }
      throw error;
    }

    void pushLog({
      type: "join",
      level: "warn",
      message: "Joined hand group but no game data",
      game: "hand",
    });
    return null;
  };

  const handHubListenersAttached = ref(false);
  const setupHandEventListenersOnce = () => {
    if (handHubListenersAttached.value) return;
    const connection = gameConnection.rawConnection;
    connection.off("handgamestatechanged");
    connection.on("handgamestatechanged", handleGameStateChanged);
    handHubListenersAttached.value = true;
  };

  const syncLastError = ref<string | null>(null);
  let syncInFlight: Promise<void> | null = null;

  async function syncHandForCurrentRoute() {
    if (syncInFlight) return syncInFlight;

    syncInFlight = (async () => {
      syncLastError.value = null;
      try {
        await gameConnection.ensureConnected();
        setupHandEventListenersOnce();
        const initialGame = await joinGameGroup();
        if (initialGame) {
          game.value = initialGame;
          game.value.teams = initialGame.teams.sort((a, b) => a.score - b.score);
        }
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : "syncHandForCurrentRoute failed";
        syncLastError.value = msg;
        console.error("Failed to sync hand game:", error);
        if (import.meta.client) {
          pushClientErrorFromUnknown("hand_store", error, {
            phase: "syncHandForCurrentRoute",
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
    console.log("Hand hub reconnected — re-joining group + fetching latest data");
    void syncHandForCurrentRoute().catch(() => {
      /* syncLastError already set */
    });
  });

  async function initializeConnection() {
    await syncHandForCurrentRoute();
  }

  // const sakkaIsMashdoda = (game: GameDataI): GameDataI => {
  //   if (game.sakkas && game.sakkas.length <= 0) return game;
  //   const lastSakka = game.sakkas[game.sakkas.length - 1];
  //   if (lastSakka.isMashdoda) {
  //     const dummy_moshtra = lastSakka.moshtaras.find((m) => m.id === 0);
  //     if (!dummy_moshtra) {
  //       lastSakka.usSakkaScore += 52;
  //       lastSakka.themSakkaScore += 52;
  //       lastSakka.moshtaras.unshift({
  //         id: 0,
  //         usAbnat: 52,
  //         themAbnat: 52,
  //         state: "Ended",
  //         advancedDetails: {
  //           moshtara: "50-50",
  //           selectedMoshtaraOwner: "Us",
  //         },
  //         startedAt: "",
  //         endedAt: "",
  //         pausingIntervals: [],
  //         isMoshtaraSucceeded: null,
  //         moshtaraOwner: null,
  //       });
  //     }
  //   }
  //   return game;
  // };

  const handelScoreMain = () => {
    if (events.includes("NamesChanged")) {
      handelNamesChanged();
    }
    if (events.includes("ScoreIncreased") && events.length == 1) {
      console.log("ScoreIncreased", "in score");
      console.log(snapshot.value);
      if (snapshot.value.matches("score.main")) {
        handelScoreIncreased();
      } else {
        handelDetailScoreIncreased();
      }
    }
    if (events.includes("ScoreDecreased")) {
      console.log("ScoreDecreased", "in score");
      handelScoreDecreased();
    }
    if (events.includes("GameStarted")) {
      console.log(snapshot.value.matches("score.main"))
      if (snapshot.value.matches("score.main") || snapshot.value.matches("score.intro")) handelGameStarted();
    }
    if (events.includes("GameEnded") && events.includes("ScoreIncreased")) {
      handelGameEndedAndScoreIncrease();
    }
  };

  const handelDetailMain = () => {
    if (events.includes("NamesChanged") && events.length == 1) {
      handelNamesChanged();
    }
    if (events.includes("ScoreIncreased") && events.length == 1) {
      handelDetailScoreIncreased();
    }
    if (events.includes("ScoreDecreased")) {
      console.log("ScoreDecreased", "in detail");
      handelScoreDecreased();
    }

    if (events.includes("GameStarted") && events.includes("NamesChanged")) {
      console.log("GameStarted", "in detail");
      // handelGameStarted();
    }
    if (events.includes("GameEnded")) {
      console.log("GameEnded", "in detail");
      handelGameEnded();
    }
  };

  const handelNamesChanged = () => {
    if (!game.value || !newGame.value) return;
    if (game.value.id == newGame.value.id) {
      Object.assign(game.value, newGame.value);
    }
  };

  const handelScoreIncreased = () => {
    if (!game.value || !newGame.value) return;
    if (game.value.id == newGame.value.id) {
      gameService.send({ type: "TO_OUTRO" });
      // Object.assign(game.value, newGame.value);
    }
  };
  const handelDetailScoreIncreased = () => {
    if (!game.value || !newGame.value) return;
    if (game.value.id == newGame.value.id) {
      Object.assign(game.value, newGame.value);
    }
  };
  const handelScoreDecreased = () => {
    // gameService.send({ type: "TO_OUTRO" });

    if (!game.value || !newGame.value) return;
    Object.assign(game.value, newGame.value);
    if (winnerTeam.value !== null) {
      let showWinner = winnerTeam.value?.players.every((p) => {
        return p.imageUrl != null;
      });
      console.log(showWinner);
      gameService.send({ type: "UPDATE_CONTEXT", ended: showWinner });
    }
  };

  const handelGameStarted = () => {
    if (!game.value || !newGame.value) return;
    Object.assign(game.value, newGame.value);
  };

  // to show  winner
  const handelGameEndedAndScoreIncrease = () => {
    // Object.assign(game.value, newGame.value);

    // if (snapshot.value.matches("score.main"))
      gameService.send({ type: "TO_OUTRO" });

    console.log(winnerTeam.value);
    if (winnerTeam.value !== null) {
      let showWinner = winnerTeam.value?.players.every((p) => {
        return p.imageUrl != null;
      });
      gameService.send({ type: "UPDATE_CONTEXT", ended: showWinner });
    }
  };

  const handelGameEnded = () => {
    if (!game.value || !newGame.value) return;
    Object.assign(game.value, newGame.value);
    console.log(winnerTeam.value);
    if (winnerTeam.value !== null) {
      let showWinner = winnerTeam.value?.players.every((p) => {
        return p.imageUrl != null;
      });
      console.log(showWinner);
      gameService.send({ type: "UPDATE_CONTEXT", ended: showWinner });
    }
  };
  // to show statics

  const top = computed(() => {
    if (game.value?.teams.length! > 0) return usTeam.value?.players[0];
  });

  const bottom = computed(() => {
    if (game.value?.teams.length! > 0) return usTeam.value?.players[1];
  });

  const left = computed(() => {
    if (game.value?.teams.length! > 0) return themTeam.value?.players[0];
  });
  const right = computed(() => {
    if (game.value?.teams.length! > 0) return themTeam.value?.players[1];
  });

  const winnerTeam = computed(() => {
    if (!game.value || game.value.winnerTeamIndex == null) {
      return null;
    }
    return game.value.teams[game.value.winnerTeamIndex];
  });
  const winnerTeamName = computed(() => {
    const team = winnerTeam.value;
    if (team) {
      const playersNames = team.players[0].name + " | " + team.players[1].name;
      const teamname = team.name;

      if (
        team.players.every((p) => {
          return p.id != null;
        })
      ) {
        return playersNames;
      } else {
        return teamname;
      }
    }
  });
  const winnerComment = computed(() => {
    return game.value?.comment.winnerRef;
  });
  const comment = computed(() => {
    return game.value?.comment.comment;
  });

  const usTeam = computed(() => {
    return game.value?.teams[0];
  });
  const themTeam = computed(() => {
    return game.value?.teams[1];
  });

  const usTeamRounds = computed(() => {
    const team = usTeam.value;

    if (team) {
      const rounds = game.value?.rounds.map((round) => {
        if (round.state != "Running") {
          const score = round.handRoundData?.teamsRoundData.find(
            (teamRound) => {
              return teamRound.teamIndex == team.index;
            }
          )?.score;
          if (
            game.value?.settings.zatMode == "WinWithZat" &&
            round.handRoundData?.selectedTeamIndex == team.index &&
            round.handRoundData.selectedValue.type == "Zat"
          ) {
            return game.value.settings.handValues.zat.arabicName;
          } else {
            return score;
          }
        }
      });
      return rounds;
    }
  });
  const themTeamRounds = computed(() => {
    const team = themTeam.value;
    if (team) {
      const rounds = game.value?.rounds.map((round) => {
        if (round.state != "Running") {
          const score = round.handRoundData?.teamsRoundData.find(
            (teamRound) => {
              return teamRound.teamIndex == team.index;
            }
          )?.score;
          if (
            game.value?.settings.zatMode == "WinWithZat" &&
            round.handRoundData?.selectedTeamIndex == team.index &&
            round.handRoundData.selectedValue.type == "Zat"
          ) {
            return game.value.settings.handValues.zat.arabicName;
          } else {
            return score;
          }
        }
      });
      return rounds;
    }
  });
  const roundNumber = computed(() => {
    return game.value?.rounds.length;
  });

  const themName = computed(() => {
    const team = themTeam.value;
    if (team) {
      const playersNames = team.players[0].name + " | " + team.players[1].name;
      const teamname = team.name;

      if (
        team.players.every((p) => {
          return p.id != null;
        })
      ) {
        return playersNames;
      } else {
        return teamname;
      }
    }
  });

  const usName = computed(() => {
    const team = usTeam.value;
    if (team) {
      const playersNames = team.players[0].name + " | " + team.players[1].name;
      const teamname = team.name;
      if (
        team.players.every((p) => {
          return p.id != null;
        })
      ) {
        return playersNames;
      } else {
        return teamname;
      }
    }
  });
  const themScore = computed(() => {
    const team = themTeam.value;

    if (team) {
      if (game.value?.settings.zatMode == "WinWithZat" && team.hasZat) {
        return game.value.settings.handValues.zat.arabicName;
      }
      return team.score;
    }
  });
  const usScore = computed(() => {
    const team = usTeam.value;
    if (team) {
      if (game.value?.teams[0]) {
        if (game.value?.settings.zatMode == "WinWithZat" && team.hasZat) {
          return game.value.settings.handValues.zat.arabicName;
        }
        return team.score;
      }
    }
  });
  const BoardStyles = computed(() => ({
    dimension: {
      height: "1920px",
      width: "1080px",
    },
    scorePanel: {
      "margin-top": "0px",
      height: "295px",
      scale: 0.9,
      leftTeam: {
        name: {
          transform: `translate(0px,0px)`,
          "font-size": "50px",
        },
        score: {
          transform: `translate(0px,0px)`,
          "font-size": "50px",
        },
      },
      rightTeam: {
        name: {
          transform: `translate(0px,0px)`,
          "font-size": "50px",
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
  }));

  return {
    // Existing reactive data
    // game_updated,

    game: game,
    statics,
    snapshot,
    gameService,
    // iamge playerss
    top,
    left,
    bottom,
    right,
    // teams names
    themName,
    usName,
    themScore,
    usScore,
    roundNumber,
    themTeamRounds,
    usTeamRounds,
    winnerTeam,
    comment,

    winnerComment,
    winnerTeamName,
    //portrait boradStyles
    BoardStyles,

    // Methods
    initializeConnection,
    syncHandForCurrentRoute,
    syncLastError,
    hubConnectionState: gameConnection.connectionState,
    hubConnectionError: gameConnection.connectionError,
  };
});
