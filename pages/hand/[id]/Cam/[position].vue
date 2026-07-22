<template>
  <component :is="camComponent" class="h-[1080px] w-[1920px]" />
</template>

<script lang="ts" setup>
import CamTop from "../../../../components/Cam/hand/Top.vue";
import CamRight from "../../../../components/Cam/hand/Right.vue";
import CamLeft from "../../../../components/Cam/hand/Left.vue";
import CamBottom from "../../../../components/Cam/hand/Bottom.vue";

const route = useRoute();
const router = useRouter();
const table_id =
  (route.params.id as string) ?? "983365b7-c1dc-4c60-8131-8450ceb934db";

const { themeQuery, themeQueryNeedsNormalize } = useRouteTheme("zat");

const allowedPositions = ["top", "left", "right", "bottom"] as const;

const gameStore = useMyHandGameStore();
await gameStore.initializeConnection();

watch(
  () => route.params.id,
  (id, prev) => {
    if (id && id !== prev) void gameStore.syncHandForCurrentRoute();
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
        path: `/hand/${table_id}/Cam/top`,
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
    path: `/hand/${table_id}/Cam/${positionKey.value}`,
    query: themeQuery(),
  });
});
</script>
