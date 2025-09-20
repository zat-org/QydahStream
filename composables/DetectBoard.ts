type BalootStore = ReturnType<typeof useMyBalootGameStore>;
type HandStore = ReturnType<typeof useMyHandGameStore>;
const DetectBoard = () => {
  const route = useRoute();
  const isBaloot = route.path.includes("baloot");
  const isHand = route.path.includes("hand");
  const store = ref<BalootStore | HandStore>();
  if (isBaloot) {
    store.value = useMyBalootGameStore() as BalootStore;
  } else if (isHand) {
    store.value = useMyHandGameStore() as HandStore;
  }
  return {  store  };
}
export type { BalootStore, HandStore };

export default DetectBoard;