<template>
  <component
    :is="camComponent"
    id="camtest"
    class="h-[1080px] w-[1920px] px-[130px] py-[9px]"
  />
</template>

<script lang="ts" setup>
import CamTop from "../../../../components/Cam/baloot/Top.vue";
import CamRight from "../../../../components/Cam/baloot/Right.vue";
import CamLeft from "../../../../components/Cam/baloot/Left.vue";
import CamBottom from "../../../../components/Cam/baloot/Bottom.vue";

const route = useRoute();
const router = useRouter();
const table_id =
  (route.params.id as string) ?? "983365b7-c1dc-4c60-8131-8450ceb934db";

const { themeQuery, themeQueryNeedsNormalize } = useRouteTheme("zat");

const allowedPositions = ["top", "left", "right", "bottom"] as const;

const gameStore = useMyBalootGameStore();
const { initializeConnection, syncBoardForCurrentRoute } = gameStore;

await initializeConnection();

watch(
  () => route.params.id,
  (id, prev) => {
    if (id && id !== prev) void syncBoardForCurrentRoute();
  },
);

const positionKey = computed(() => {
  const p = String(route.params.position ?? "top").toLowerCase();
  if ((allowedPositions as readonly string[]).includes(p)) {
    return p as (typeof allowedPositions)[number];
  }
  return "top";
});

watch(
  () => route.params.position,
  (pos) => {
    const p = String(pos ?? "").toLowerCase();
    if (!(allowedPositions as readonly string[]).includes(p)) {
      void router.replace({
        path: `/baloot/${table_id}/Cam/top`,
        query: themeQuery(),
      });
    }
  },
  { immediate: true },
);

const camComponent = computed(() => {
  switch (positionKey.value) {
    case "top":
      return CamTop;
    case "left":
      return CamLeft;
    case "right":
      return CamRight;
    case "bottom":
      return CamBottom;
    default:
      return CamTop;
  }
});

onMounted(() => {
  if (!themeQueryNeedsNormalize()) return;
  void router.replace({
    path: `/baloot/${table_id}/Cam/${positionKey.value}`,
    query: themeQuery(),
  });
});
</script>
