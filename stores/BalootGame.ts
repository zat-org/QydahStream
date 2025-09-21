import { defineStore } from "pinia";
import type {  GameDataI, GameI, IStatics, SakkaI } from "~/models/game";
import type { BoardSettingsI } from "~/models/boardSettings";
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
  const setupBalootEventListeners = () => {
    const connection = gameConnection.rawConnection;
    connection.on("BalootGameStateChanged", handleGameStateChanged);
  };
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




  const resetState = () => {
    newGameFlag.value = false;
    sakka_ended.value = false;
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
  const handleSpecialEvents = () => {
    if (events.includes("SakkaEnded")) {
      game.value = newGame.value;
      handelSakkaEnded();
    }

    if (events.includes("SakkaStarted")) {
      console.log("Sakka started");
    }

    if (events.includes("GameEnded")) {
      game.value = newGame.value;
      handelGameEnded();
    }
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
      const gameedndedevents: BalootGameEvent[] = ["SakkaEnded", "GameEnded"];
      if (gameedndedevents.every((event) => events.includes(event))) {
        game.value = newGame.value;
      } else {
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
    const contimuefrombackEvents:BalootGameEvent[] =["ScoreDecreased", "GameContinuedFromBack"]
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

  // players images
  const top = computed(() => {
    if (game.value?.themPlayers.length! > 0) return game.value?.usPlayers[0];
  });

  const bottom = computed(() => {
    if (game.value?.themPlayers.length! > 0) return game.value?.usPlayers[1];
  });

  const left = computed(() => {
    if (game.value?.themPlayers.length! > 0) return game.value?.themPlayers[1];
  });
  const right = computed(() => {
    if (game.value?.themPlayers.length! > 0) return game.value?.themPlayers[0];
  });

  const themName = computed(() => {
    return game.value?.themName
      ? game.value?.themName
      : game.value?.themPlayers.length == 0
        ? "لهم"
        : game.value?.themPlayers[0].name +
        " | " +
        game.value?.themPlayers[1].name
  })
  
  const usName = computed(() => {
    return game.value?.usName
      ? game.value?.usName
      : game.value?.usPlayers.length == 0
        ? "لنا"
        : game.value?.usPlayers[0].name + " | " + game.value?.usPlayers[1].name
  
  })
  const portraitBoardSettings = computed(() => {
    return boardSettings.value?.portrait;
  });
  
  const BoardStyles = computed(() => {
    return {
      dimension: {
        height: '1920px',
        width: '1080px',
      },
      scorePanel: {
        "margin-top": "0px",
        height: "295px",
        scale: .9,
        leftTeam: {
          name: {
            transform: `translate(0px,0px)`,
            'font-size': "30px",
          },
          score: {
            transform: `translate(0px,0px)`,
            'font-size': "50px",
          },
        },
        rightTeam: {
          name: {
            transform: `translate(0px,0px)`,
            'font-size': "30px",
          },
          score: {
            transform: `translate(0px,0px)`,
            'font-size': "50px",
          },
        }
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
      }
    }
  
    return {
      dimension: {
        height: portraitBoardSettings.value?.dimension.height + 'px',
        width: portraitBoardSettings.value?.dimension.width + 'px',
      },
      scorePanel: {
        'margin-top': portraitBoardSettings.value?.scorePanel.topMargin + "px",
        height: portraitBoardSettings.value?.scorePanel.height + "px",
        scale: portraitBoardSettings.value?.scorePanel.position.scale,
        leftTeam: {
          name: {
            transform: `translate(${portraitBoardSettings.value?.scorePanel.leftTeam.name.left}px, ${portraitBoardSettings.value?.scorePanel.leftTeam.name.top}px)`,
            'font-size': portraitBoardSettings.value?.scorePanel.leftTeam.name.size + "px",
          },
          score: {
            transform: `translate(${portraitBoardSettings.value?.scorePanel.leftTeam.score.left}px,${portraitBoardSettings.value?.scorePanel.leftTeam.score.top}px)`,
            'font-size': portraitBoardSettings.value?.scorePanel.leftTeam.score.size + "px",
          }
        },
        rightTeam: {
          name: {
            transform: `translate(${portraitBoardSettings.value?.scorePanel.rightTeam.name.left}px, ${portraitBoardSettings.value?.scorePanel.rightTeam.name.top}px)`,
            'font-size': portraitBoardSettings.value?.scorePanel.rightTeam.name.size + "px",
          },
          score: {
            transform: `translate(${portraitBoardSettings.value?.scorePanel.rightTeam.score.left}px,${portraitBoardSettings.value?.scorePanel.rightTeam.score.top}px)`,
            'font-size': portraitBoardSettings.value?.scorePanel.rightTeam.score.size + "px",
          }
        }
      },
      leftPlayer: {
        top: `calc(50% - ${(portraitBoardSettings.value?.playerImageWidth ?? 200) / 2}px ) + ${portraitBoardSettings.value?.leftPlayer.top}px`,
        left: `${portraitBoardSettings.value?.leftPlayer.left}px`,
        height: `${portraitBoardSettings.value?.playerImageWidth}px`,
        width: `${portraitBoardSettings.value?.playerImageWidth}px`,
      },
      rightPlayer: {
        top: `calc(50% - ${(portraitBoardSettings.value?.playerImageWidth ?? 200) / 2}px ) + ${portraitBoardSettings.value?.rightPlayer.top}px`,
        right: `${portraitBoardSettings.value?.rightPlayer.right}px`,
        height: `${portraitBoardSettings.value?.playerImageWidth}px`,
        width: `${portraitBoardSettings.value?.playerImageWidth}px`,
      },
      bottomPlayer: {
        left: `calc(50% - ${(portraitBoardSettings.value?.playerImageWidth ?? 200) / 2}px ) + ${portraitBoardSettings.value?.bottomPlayer.left}px`,
        bottom: `${portraitBoardSettings.value?.bottomPlayer.bottom}px`,
        height: `${portraitBoardSettings.value?.playerImageWidth}px`,
        width: `${portraitBoardSettings.value?.playerImageWidth}px`,
  
      },
      detailScore: {
        color: portraitBoardSettings.value?.detailScore.color,
        "font-size": portraitBoardSettings.value?.detailScore.fontSize + "px",
      }
    }
  
  })

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
    if (statics.value)
      return statics.value.usStatistics;
  });
  const statusThem = computed(() => {
    if (statics.value)
      return statics.value.themStatistics;
  });

  const winner = computed(() => {
    if (game?.value?.winner) {
      if (game.value.winner == "Us") {
  
        return {
          players: game.value.usPlayers.length > 0 ? game.value.usPlayers : null,
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
    top,bottom,left,right,
    themName,usName,
    BoardStyles,
    last_sakka,
    ended_moshtras,
    gameState,
    usGameScore,themGameScore,
    statusUs,statusThem,
    winner,
// connection

    initializeConnection,
// set data for index page 
    setGameData,
  };
});
