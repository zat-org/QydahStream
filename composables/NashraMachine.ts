import { assign, createMachine } from "xstate";
export const useNashraMachine = () => {
  const gameMachine = createMachine(
    {
      /** @xstate-layout N4IgpgJg5mDOIC5RQIYFswGICqAFAIgIIAqAogPoDCA8gHJkAaxA2gAwC6ioADgPawBLAC4DeAOy4gAHogCMAJgAs8gHSKAbAA5ZrWToCcAZgDs+xQBoQATznyAvncuoMK2AGNeAJzAqBYoZ68mLSkTGycSCB8giLikjII6oqGKpqK+qzyhqysZskArJY2CDqs6iqmxpqshvlKGvmGDk7oPu5ePmgofpjE1OTU2MQAStThktHCohKRCfrqKca1+kuyWrL5mkVyOeWV1bX16o3NIM5tHt4qvACuAUEhYRwT-FNxs3LKmiprspqb+Uq+WB2xKuwqKwOdUUDXyp3OKggYCE3QANr5-IFgqEWM9IpNYjNQAk-opWCotBk1voNhtkqCdIpjCpDJp5vl1CtDMktPDWojkWiVF0en0BkNRuN8a9CfFEPI1uT5PI6gpGoZ1Op5MYGawmSy2cdOUseZo+S4kSiBOjbvdMJQABKkSgAaXIpFo+ClPBl0zlCEBDM0KVkxm1mjZhnk+m1ZnNPktQttWMdzrdHq9sgiPpifo+CHkOQqih0ek08nUxjKEYZof0qTZ+XS-2BWjhjjO-NgKJEblgGLtj1x2aivvexMQJm++VDeu00bM0NBGhSunmmqWbP0MfU8dcPYEfeF3TEvX6gxGYzxObeROkiC0qmM1KSyufhcK1kQK5Ua81ldZbcdz3bsUF7ftkyCVNXXdT1vVHXNx3vEoNhSYM2U0LVjGOHQdS-BAmWZVkNQjHCTF0ECDyPSD7SdGCM2YLMXkQu8EkrUEjFkFQlG5YwmWjWRDHmPcAHc-DEMBPAHLEh3ggk8wnEpsK47DFH+NIo1YCM8OKGdmRWQEm1ZNJtF3DsETEsQJKkkVTxCAB1cgAHFCAAWVIOSx1YxBA3w-RtG41hAVqYMDPyfQHA7MReCReBInOZjb39ABaCw-MUFQzFjZ9MLKEtjBAy4wES2V80MNZf2BHIhMUGdOVBNkMv0DlNU0bC9SbdsWhcdorj8e4SoU5CNQyoL8mqxdqQ44Mfkw4xwu1Z9mvscyuyK48-EGpCEj4vZnzKDU21kdJppDOaFuMJa6kKjprjuQItu8lCyky5QyiCiNyp0xB-LOysLqulbuoTQVrUe-1aVXNIcmDPVo1qDjahUJsIwKBYankM1VotUH0X6h7pRYiGOS4rSyS07JlCMT9ih0LIKiqJa0jJWoCuxkGrXRWzwfzWQzBSdQ9CC+a+OVdRdXpy62r55makBPdE2tO6BsJpL8yyGo1HKvmtM+ptxfwunFkZmWYTltngf3MDDzim9SsUmFQVqLjQ3+QwhOVTZBa6zseqo-t8d4HnFJjZchLULStRhISo15dmrfAja73k7bvwC5IMm5FUtWDTUw-rMlMPqGOKyxy3QMTyDg+Q8t8ky5Uss2P4FH0fOI6L6OjFLxRRPEyTq5JZRyk65rmdq8bDGXF7BI0BVAULNsLd9nxLOs6Sg9V+3kOOvjkdq0eYXHmplzMFkknfXXqhjXurMkpOB7kTCMq0SkMhpRVJ-w9IMpGi+IyvlaDggA */
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
        isMatchEnded: (ctx) => ctx.context.ended, // Check if match has ended
        isSakkaEnded: (ctx) => ctx.context.sakkaended, // Check if match has ended

      },
    }
  );
  return { gameMachine };
};
