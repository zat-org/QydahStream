import { assign, createMachine } from "xstate";
export const useNashraMachine = () => {
  const gameMachine = createMachine(
    {
      /** @xstate-layout N4IgpgJg5mDOIC5RQIYFswGICqAFAIgIIAqAogPoDCA8gHJkAaxA2gAwC6ioADgPawBLAC4DeAOy4gAHogCMsgCwBWAHQB2ABwKAzBoBsCgJxKATK23aANCACeckwF8H11BhWwAxrwBOYFQLEhb15MWlImNk4kED5BEXFJGQRZPT1VNW1ZEzUs1jU9TIVrOwQlbUMVA201JQ1DBQKleqcXdD9PHz80FADMYmpyamxiACVqSMlY4VEJaKTZQxz1PQ01DJSzPTVDYsQyiqqauobtJoUWkFd2r18VXgBXIJCwiI5J-mmEub21XeSNWQqDSrJSsEx6Ew6Qzgi5XFQQMBCHoAG38gWCoXCLDe0Sm8VmoCS2j0gNYSghSiUC1SmVkfwUGlUrB0Rw0xJWK1hbXhiJRKm6vX6g2GYwmuI++MSiFSGhUDKySgUeTUJnJJnpjJUzOqtTZMs5zku3IRSIEqIeT0wlAAEqRKABpcikWj4MU8CUzKXJViyVQNZSrBRmYysHa2RDZVgqWQ1PJNQwFfLac6GuEmvkWjE2u2O52u2RRd1xT3fZKyVhR2SZVV6aEaSFrP6nQGZEENcwpLluADuATEYG8aMtL2xhZiHq+hLktdlZIpJl02hMdabyZUrZqBT0eVD+S7fl7Yn7g4FYkxAHVyABxQgAWVIbvHxcn0gjij0cqritjlKVSibPpaoYKQZIYoYWLUTiGmIvAIvA0RXO8z4Eq+CAALRFOGCD1OuII+gyOQaKGej7u4NxgEhnwofMpxRtqNSGMCSgqmGJRBrKqoVvo8gQc0qbch0twBE8lGSqWVaMVqLJNExLF-FS6Sgj6FaLGCtakYJXQ9CheIllOyT5Ao64shkrB1LR6pYQp6hKeWu5qYYGnkXcjzBKJemoSY5YVGCoLZPKraYSU1mxsp9nZKR6Zmu5L5JAoQWINU2iVEYixZGszL+pFvJmkObnishXrQvSJLRkpoaMRkiopq0bhRaip4xdRiDKAcKw1GoeRskYGglYCvoVhVqynPF2Wmuarm8E1XpEekOpmeUaSsCsfVlYNhiVSNyikYex7TeJ1QmCoYGDQYnUrHSWEmNdx2cWypgZYxO19gOeVTQVVFeooZjHYNy0KOdAJNuWcqcXGPFrDoz1Hq9jUfWJ+kxgmlTtYq4KgvIejA1GQZKTUENqCmThAA */
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
