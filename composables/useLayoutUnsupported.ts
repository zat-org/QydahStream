import type { Component } from "vue";

type GameSnapshot = {
  matches: (state: string) => boolean;
};

export function useLayoutUnsupported(
  snapshot: Ref<GameSnapshot>,
  components: {
    scoreComponent: Ref<Component | null>;
    detailComponent: Ref<Component | null>;
    staticsComponent: Ref<Component | null>;
    winnerComponent: Ref<Component | null>;
  },
) {
  return computed(() => {
    const s = snapshot.value;
    if (s.matches("score")) return components.scoreComponent.value == null;
    if (s.matches("detail")) return components.detailComponent.value == null;
    if (s.matches("statics")) return components.staticsComponent.value == null;
    if (s.matches("winner")) return components.winnerComponent.value == null;
    return false;
  });
}
