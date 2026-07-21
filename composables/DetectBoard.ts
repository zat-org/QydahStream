type BalootStore = ReturnType<typeof useMyBalootGameStore>;
type HandStore = ReturnType<typeof useMyHandGameStore>;
const DetectBoard = () => {
  const route = useRoute();
  const isHand = route.path.includes("hand");
  // Default to baloot: `/`, `/[id]`, `/baloot/...`, `/tournament/...`
  const store = ref<BalootStore | HandStore>();
  if (isHand) {
    store.value = useMyHandGameStore() as HandStore;
  } else {
    store.value = useMyBalootGameStore() as BalootStore;
  }
  return { store };
};
export type { BalootStore, HandStore };

export default DetectBoard;