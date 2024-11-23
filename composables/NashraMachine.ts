import { assign, createMachine } from "xstate";
export const useNashraMachine = () => {
  const gameMachine = createMachine(
    {
      /** @xstate-layout N4IgpgJg5mDOIC5RQIYFswGICqAFAIgIIAqAogPoDCA8gHJkAaxA2gAwC6ioADgPawBLAC4DeAOy4gAHogCMrAGysAdAE4AzABZNAJlY71qgOyz16gDQgAnnMXLWAVlbOAHKodH3rF7IC+vy1QMHAISClJafABlQgBpWMI2TiQQPkERcUkZBHkHB2UXE1UdU00XR1lLGxydf0D0MGVYAGNeACdGgTEhNt5MWlImJMk04VEJFOz1HwL1IwdNVRcdA1kFSus5cqNlU0M8w1VjMzqQIMaW9sa0FC7MYmpyamxiACVqYZTRjInQbKNnMoFJpprpWKp5IoNtVZNtdmZ3A5Dsd1Kdzk1Wh1lLwAK49PoDIYcEb8MaZSaIQpVRCefJ6FzLfTTNwGNENZQQMBCW4AG2UXXx-UGLGJX1JPyyiDmsiB6lksnciwU6j0impCE0Chcymm03Bsk08oNfgCZ3ZnO5Aj5NzuDyeL3enx44vGkoQClUKm88q8eiM-oU6s12t15QhhvlhrZGA5XN52LxvUwlAAEqRKLFyBF8E7Ui7yX85Gt1ModHklvM9HLNUHNCoNNMHDp1s51PojNHGhb47jBan05ns8xZMlnelXRScsXS+XCk3WNXA5sNW5lJ5lYt1B7WCYTfUY92rQm+2mM1nIswdKO8+OC9IaUZ1RD8gbnEdlu4jHNO01uSJmrA-LdEmhIite3wToWCDMsoDhakYLianByxGEuMKKKoQIOAyqgKPMSKIXuZoxrAf4CAByg2mI9yPM8bwfKKY5kr897uhCQI+KssieAYrCaOq8gelhOF4QchE-qRKD-oBvZJv2Z5DoxN7MW68rrGu8z6GU2GIf6AneCWDYMnKsgOPIqiaBJZEUbJfTyYOF4jiSt4sdkakyv6Tg6NpDKaHpy7yOo+Q7qYZl4QCzgKD+ADuXRiGAbRAYKoG5hBd5uah2oenqTbAssOgCc2OzlG4rBrJGiioqa6KxWI8WJVRQoAOrkAA4oQACypCpfmrmICUO6yns6xGCUcH8QFRUFN4nrla+UWnGIvCcvAKTnM5KmTgAtBN1TNphr5lZ4pmzR21XspcHQbRKk4LAJHr5HBZkIboyyghJmKdMBvDXZBrHyAVAUISW3n6JCJTebhH1XJRtwsWlfUriWChwTonpfsCwIWQJwOlnWA1g5DC37hcn3Hr0v3pZSugaU4LhNmWr04y4IP4+DshEz+h48pTiPaOqQUKAUpkLiU2WeHxXNxkeAoU2KLlusUtaaMoiyRXMCgGJ6DhS5a1pw7zbp+SWmhOM4HhakoDjK6rnqVahWuOLrPaJj98ubVBLM6KWHPTM2lvozbav25rhhO+dJHWatTE3VBd3Lu42rgmV0qrCzVlSeRgGy27Md-W5+j6aba4o6UC4mM2OsRxcUew10huTmrOpzmWHjgqh-MBXx+SoWZWjlxzKMZ9J5O58psesSzJacX5IKmCjBhFz3pf96nQ-V8otX1Q3UEGmYqtym2jgqosSwCaZQugydcqFIYtQb1vCVJXLedUzkZQynPR9IpDZ+TSCahTIXwMM2ZYxNiKNEfg1A27sJ5uUKCoMyzZTJIhMIoR8-9DJANRiqLUzZ-D+CAA */
      id: "game",

      // Start in the score state by default
      initial: "score",

      context: {
        ended: false, // Boolean flag to indicate if the game has ended
        sakkaended:false
      },

      states: {
        score: {
          initial: "intro", // Default substate for 'score'
          states: {
            intro: {
              entry: ["startScoreIntroAnimation"],
              on: {
                NEXT: "main", // Transition to 'main' on NEXT event
              },
            },
            main: {
              entry: ["loadScoreData"],
              on: {
                TO_OUTRO: "outro", // Transition to 'outro' on TO_OUTRO event
              },
            },
            outro: {
              entry: ["startScoreOutroAnimation"],
              on: {
                NEXT: "#game.detail", // After score outro, move to detail state
              },
            },
          },
        },
        detail: {
          initial: "intro",
          states: {
            intro: {
              entry: ["startDetailIntroAnimation"],
              on: {
                NEXT: "main",
              },
            },
            main: {
              entry: ["loadDetailData"],
              on: {
                TO_OUTRO: "outro",
              },
            },
            outro: {
              entry: ["startDetailOutroAnimation"],
              on: {
                CHECK_END: [
                  // { target: "#game.winner", guard: "isMatchEnded" }, // If match ended, go to winner
                  { target: "#game.statics", guard: "isSakkaEnded" }, // If match ended, go to winner      
                  { target: "#game.winner", guard: "isMatchEnded" },
                  { target: "#game.score" }, // Otherwise, return to score state
                ],
              },
            },
          },
        },

        statics: {
          initial: "intro",
          states: {
            intro: {
              entry: ["startStaticsIntroAnimation"],  
              on: {
                NEXT: "main",
              },
            },
            main: {
              entry: ["showStatics"],
              on: {
                TO_OUTRO: "outro",
              },
            },
            outro: {
              entry: ["startStaticsOutroAnimation"],
              on: {
                CHECK_END: [
                  { target: "#game.winner", guard: "isMatchEnded" }, // If match ended, go to winner
     
                  { target: "#game.score" }, // Otherwise, return to score state
                ],
              },
            },
          },
        },
      
        winner: {
          initial: "intro",
          states: {
            intro: {
              entry: ["startWinnerIntroAnimation"],
              on: {
                NEXT: "main",
              },
            },
            main: {
              entry: ["showWinner"],
              on: {
                NEW_GAME: "#game.score", // Transition back to score for a new game
              },
            },
          },
        },
      },
      on: {
        UPDATE_CONTEXT: {
          actions: assign((context: any) => {
            return { ended: context.event.ended };
          }),
        },
        UPDATE_ENDSAKKA: {
          actions: assign((context: any) => {
            return { sakkaended: context.event.sakkaended };
          }),
        },
      },
    },
    {
      actions: {
        startScoreIntroAnimation: () => console.log("Score Intro Animation"),
        loadScoreData: () => console.log("Loading Score Data"),
        startScoreOutroAnimation: () => console.log("Score Outro Animation"),
        startDetailIntroAnimation: () => console.log("Detail Intro Animation"),
        loadDetailData: () => console.log("Loading Detail Data"),
        startDetailOutroAnimation: () => console.log("Detail Outro Animation"),
        startStaticsIntroAnimation:() => console.log("staticts intro Animation"),
        showStatics:() => console.log(" load staticts data "),
        startStaticsOutroAnimation:() => console.log("staticts outro Animation"),
        startWinnerIntroAnimation: () => console.log("Winner Intro Animation"),
        showWinner: () => console.log("Showing Winner"),
      },
      guards: {
        isMatchEnded: (ctx) => ctx.context.ended==true, // Check if match has ended
        isSakkaEnded: (ctx) => ctx.context.sakkaended==true, // Check if match has ended

      },
    }
  );
  return { gameMachine };
};
