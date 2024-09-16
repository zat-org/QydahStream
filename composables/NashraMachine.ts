import { assign, createMachine } from "xstate";
export const useNashraMachine = () => {
  const gameMachine = createMachine(
    {
      //** @xstate-layout N4IgpgJg5mDOIC5RQIYFswGICqAFAIgIIAqAogPoDCA8gHJkAaxA2gAwC6ioADgPawBLAC4DeAOy4gAHogCMsgCwBWAHQB2ABwKAzBoBsCgJxKATK23aANCACeckwF8H11BhWwAxrwBOYFQLEhb15MWlImNk4kED5BEXFJGQRZPT1VNW1ZEzUs1jU9TIVrOwQlbUMVA201JQ1DBQKleqcXdD9PHz80FADMYmpyamxiACVqSMlY4VEJaKTZQxz1PQ01DJSzPTVDYsQyiqqauobtJoUWkFd2r18VXgBXIJCwiI5J-mmEub21XeSNWQqDSrJSsEx6Ew6Qzgi5XFQQMBCHoAG38gWCoXCLDe0Sm8VmoCS2j0gNYSghSiUC1SmVkfwUGlUrB0Rw0xJWK1hbXhiJRKm6vX6g2GYwmuI++MSiFSGhUDKySgUeTUJnJJnpjJUzOqtTZMs5zku3IRSIEqIeT0wlAAEqRKABpcikWj4MU8CUzKXJeR6FSyTKqjLAurMv6FOUA1VU0H+5qGuEmvkWjE2u2O52u2RRd1xT3fb0pP0BpRB4GGUO2RBGCqZEHAgyyZmGLluADuATEYG8aMtL2x2ZiHq+hLkekMsrJFJMum0JmhGjD2gUKlrNQKejyrEWeichrEvAR8GiV3eueH0kQAFoipWEPUVCYFawweZVQttC3rp1T58CRfkqcrBaiyTTAiWc70iYE41M++SshC5zxtyHS3AETw-pK+axhOIHjoyKo7Le0bqKCrCNluahgmOn7uDcXQ9H+eJ5iOyT5MuS7VBkrB1IB6pEbI6SkeRixUc2SFuChfjJrwGHMf+j5blqqpgmo8q1jeJTETBZHPiJ2Q0YmZqyeeSQKBpiDVNocraWuEL+moBm8maPbBMZf5JNC9Ikn6pFbuOGSKohrRuIZqICoxQ7uVWTSVCsNSUZoS7jl5gICc+fmrKcZmOaa5qPK54pnlFCAaGS6g6tx5RpKwKwpT56WGP5WXKDR7ZiJ23huV69kmCo5bpQYlErHSt4mGNJHpaC5bTlsH7iX4bUdS5MmFb+3UKGYfXpTVChDQCYaNnKyl5FS9mqXNwULR2Xb8gxXVYdsvoyjUG3VT6B1ARtpE1PInGIU4QA */
      id: "game",

      // Start in the score state by default
      initial: "score",

      context: {
        ended: false, // Boolean flag to indicate if the game has ended
        
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
            console.log(context.event.ended);
            return { ended: context.event.ended };
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
        startWinnerIntroAnimation: () => console.log("Winner Intro Animation"),
        showWinner: () => console.log("Showing Winner"),
      },
      guards: {
        isMatchEnded: (ctx) => ctx.context.ended, // Check if match has ended
      },
    }
  );
  return { gameMachine };
};
