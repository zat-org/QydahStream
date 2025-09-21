import { defineStore } from "pinia";
import type { IStatics } from "~/models/game";
import type { BoardSettingsI } from "~/models/boardSettings";
import { interpret } from "xstate";
import {
  createGameConnection,
  parseEvents,
  type GameConnection,
  ConnectionState,
} from "~/utils/connection";
import type { HandGameI, HandGameDataI } from "~/models/handGame";

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
  const boardSettings = ref<BoardSettingsI>()!;
  const newGame = ref<HandGameDataI>()!;

  let events: HandGameEvent[] = [];

  const { gameMachine } = useNashraMachine();
  const gameService = interpret(gameMachine).start();
  const snapshot = ref(gameService.getSnapshot());

  // State machine subscription with debugging
  gameService.subscribe((state) => {
    snapshot.value = state;
    if (state.matches("detail.outro") && gameEnd.value) {
      game.value = newGame.value;
      console.log(winnerTeam.value);
      if (winnerTeam.value !== null) {
        let showWinner = winnerTeam.value?.players.every((p) => {
          return p.imageUrl != null;
        });
        console.log(showWinner);
        gameService.send({ type: "UPDATE_CONTEXT", ended: showWinner });
      }
      gameEnd.value = false;
    }
    if (state.matches("score.intro")) {
      game.value = newGame.value;
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
        newGame.value.teams = parsedNewGame.teams.sort(
          (a, b) => a.score - b.score
        );
        // newGame.value = sakkaIsMashdoda(parsedNewGame) as GameDataI;
      } catch (error) {
        console.error("Failed to parse game data:", error);
        return;
      }

      handleSpecialEvents();
    } catch (error) {
      console.error("Error in handleGameStateChanged:", error);
    }
  };

  const setupBalootEventListeners = () => {
    const connection = gameConnection.rawConnection;
    connection.on("handgamestatechanged", handleGameStateChanged);
  };

  // Handle special events that can occur in any state
  const handleSpecialEvents = () => {
    if (events.includes("NamesChanged")) {
      handelNamesChanged();
    }
    if (events.includes("ScoreIncreased")) {
      handelScoreIncreased();
    }
    if (events.includes("ScoreDecreased")) {
      handelScoreDecreased();
    }
    if (events.includes("GameEnded")) {
      handelGameEnded();
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
        const parsedGame = JSON.parse(gameData) as HandGameDataI;
        // parsedGame.gameData = sakkaIsMashdoda(parsedGame.gameData) as GameDataI;
        return parsedGame;
      }
    } catch (error) {
      console.error("Failed to join game group:", error);
      throw error;
    }

    return null;
  };

  async function initializeConnection() {
    try {
      await gameConnection.initializeConnection();
      const initialGame = await joinGameGroup();
      if (initialGame) {
        console.log("initialGame", initialGame);

        game.value = initialGame;
        // get  first 2 lowest team score
        game.value.teams = initialGame.teams.sort((a, b) => a.score - b.score);
        // console.log("game.value", game.value.teams);
        // console.log("initialGame.gameData", initialGame.gameData);

        // boardSettings.value = initialGame.boardSettings;
      }
      setupBalootEventListeners();
    } catch (error) {
      console.error("Failed to initialize connection:", error);
      throw error;
    }
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

  const handelNamesChanged = () => {
    game.value!.teams = newGame.value!.teams;
  };

  const handelScoreIncreased = () => {
    gameService.send({ type: "TO_OUTRO" });
    game.value!.teams = newGame.value!.teams;
    game.value!.rounds = newGame.value!.rounds;
  };
  const handelScoreDecreased = () => {
    // gameService.send({ type: "TO_OUTRO" });
    game.value!.teams = newGame.value!.teams;
  };

  // to show  winner
  const handelGameEnded = () => {
    if (snapshot.value.matches("score")) {
      game.value = newGame.value;
      console.log(winnerTeam.value);
      if (winnerTeam.value !== null) {
        let showWinner = winnerTeam.value?.players.every((p) => {
          return p.imageUrl != null;
        });
        console.log(showWinner);
        gameService.send({ type: "UPDATE_CONTEXT", ended: showWinner });
      }
    } else if (snapshot.value.matches("detail")) {
      gameEnd.value = true;
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
    if (game.value!.winnerTeamIndex == null) {
      return null;
    }
    return game.value?.teams[game.value!.winnerTeamIndex];
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
          return score;
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
          return score;
        }
      });
      return rounds;
    }
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
      return team.score;
    }
  });
  const usScore = computed(() => {
    if (game.value?.teams[0]) {
      return game.value?.teams[0].score;
    }
  });
  const portraitBoardSettings = computed(() => {
    return boardSettings.value?.portrait;
  });

  const BoardStyles = computed(() => {
    return {
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
    };

    return {
      dimension: {
        height: portraitBoardSettings.value?.dimension.height + "px",
        width: portraitBoardSettings.value?.dimension.width + "px",
      },
      scorePanel: {
        "margin-top": portraitBoardSettings.value?.scorePanel.topMargin + "px",
        height: portraitBoardSettings.value?.scorePanel.height + "px",
        scale: portraitBoardSettings.value?.scorePanel.position.scale,
        leftTeam: {
          name: {
            transform: `translate(${portraitBoardSettings.value?.scorePanel.leftTeam.name.left}px, ${portraitBoardSettings.value?.scorePanel.leftTeam.name.top}px)`,
            "font-size":
              portraitBoardSettings.value?.scorePanel.leftTeam.name.size + "px",
          },
          score: {
            transform: `translate(${portraitBoardSettings.value?.scorePanel.leftTeam.score.left}px,${portraitBoardSettings.value?.scorePanel.leftTeam.score.top}px)`,
            "font-size":
              portraitBoardSettings.value?.scorePanel.leftTeam.score.size +
              "px",
          },
        },
        rightTeam: {
          name: {
            transform: `translate(${portraitBoardSettings.value?.scorePanel.rightTeam.name.left}px, ${portraitBoardSettings.value?.scorePanel.rightTeam.name.top}px)`,
            "font-size":
              portraitBoardSettings.value?.scorePanel.rightTeam.name.size +
              "px",
          },
          score: {
            transform: `translate(${portraitBoardSettings.value?.scorePanel.rightTeam.score.left}px,${portraitBoardSettings.value?.scorePanel.rightTeam.score.top}px)`,
            "font-size":
              portraitBoardSettings.value?.scorePanel.rightTeam.score.size +
              "px",
          },
        },
      },
      leftPlayer: {
        top: `calc(50% - ${
          (portraitBoardSettings.value?.playerImageWidth ?? 200) / 2
        }px ) + ${portraitBoardSettings.value?.leftPlayer.top}px`,
        left: `${portraitBoardSettings.value?.leftPlayer.left}px`,
        height: `${portraitBoardSettings.value?.playerImageWidth}px`,
        width: `${portraitBoardSettings.value?.playerImageWidth}px`,
      },
      rightPlayer: {
        top: `calc(50% - ${
          (portraitBoardSettings.value?.playerImageWidth ?? 200) / 2
        }px ) + ${portraitBoardSettings.value?.rightPlayer.top}px`,
        right: `${portraitBoardSettings.value?.rightPlayer.right}px`,
        height: `${portraitBoardSettings.value?.playerImageWidth}px`,
        width: `${portraitBoardSettings.value?.playerImageWidth}px`,
      },
      bottomPlayer: {
        left: `calc(50% - ${
          (portraitBoardSettings.value?.playerImageWidth ?? 200) / 2
        }px ) + ${portraitBoardSettings.value?.bottomPlayer.left}px`,
        bottom: `${portraitBoardSettings.value?.bottomPlayer.bottom}px`,
        height: `${portraitBoardSettings.value?.playerImageWidth}px`,
        width: `${portraitBoardSettings.value?.playerImageWidth}px`,
      },
      detailScore: {
        color: portraitBoardSettings.value?.detailScore.color,
        "font-size": portraitBoardSettings.value?.detailScore.fontSize + "px",
      },
    };
  });

  return {
    // Existing reactive data
    // game_updated,

    game: game,
    boardSettings: boardSettings,
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
    themTeamRounds,
    usTeamRounds,
    winnerTeam,
    winnerComment,
    winnerTeamName,
    //portrait boradStyles
    BoardStyles,

    // Methods
    initializeConnection,
  };
});
