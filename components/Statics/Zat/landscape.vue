<template>


  <div class="grid grid-cols-3  overflow-hidden w-[1920px] h-[1080px]">
    <div  class="flex flex-col gap-2 ">
      <p id="usName"> 
        {{ game!.usName }}
      </p>
      <p class="usData"> {{ statusUs?.moshtaraSunCount }}</p>
      <p class="usData">{{ statusUs?.moshtaraHokmCount }}</p>
      <p class="usData">{{ statusUs?.wonMoshtaraCount }}</p>
      <p class="usData">{{ statusUs?.lostMoshtaraCount }} </p>
      <p class="usData"> {{ statusUs?.sra }} </p>
      <p class="usData"> {{ statusUs?.baloot }}</p>
      <p class="usData"> {{ statusUs?.khamsen }}</p>
      <p class="usData"> {{ statusUs?.me2a }}</p>
      <p class="usData"> {{ statusUs?.rob3ome2a }}</p>
      <p class="usData"> {{ statusUs?.sunKaboot }}</p>
    </div>
    <div class="flex flex-col gap-2  " id="titles">
      <p></p>
      <p>مشترى صن</p>
      <p>مشترى حكم</p>
      <p>مشتريات ناجحة</p>
      <p> مشتريات خسرانة</p>
      <p> سرا</p>
      <p> بلوت</p>
      <p> خمسين</p>
      <p> مية</p>
      <p> أربعمية</p>
      <p> عدد الكبابيت صن</p>
    </div>
    <div class="flex flex-col gap-2 ">

      <p id="themName">{{ game!.themName }}</p>
      <p class="themData">{{ statusThem?.moshtaraSunCount }}</p>
      <p class="themData">{{ statusThem?.moshtaraHokmCount }}</p>
      <p class="themData">{{ statusThem?.wonMoshtaraCount }}</p>
      <p class="themData">{{ statusThem?.lostMoshtaraCount }} </p>
      <p class="themData"> {{ statusThem?.sra }}</p>
      <p class="themData"> {{ statusThem?.baloot }}</p>
      <p class="themData"> {{ statusThem?.khamsen }}</p>
      <p class="themData"> {{ statusThem?.me2a }}</p>
      <p class="themData"> {{ statusThem?.rob3ome2a }}</p>
      <p class="themData"> {{ statusThem?.sunKaboot }}</p>
    </div>


  </div>


</template>

<script lang="ts" setup>

const gameStore = useMyGameStore()
const { statics, game } = storeToRefs(gameStore)

const statusUs = computed(() => {
  if (statics.value)
    return statics.value.usStatistics;
});
const statusThem = computed(() => {
  if (statics.value)
    return statics.value.themStatistics;
});

const { sleep } = useSleep()

onMounted(async () => {
  console.log("Hello 1 ")
  await sleep(1000)
  // gameStore.gameService.send({ type: "NEXT" });
  // console.log("Hello 2")
  // await sleep(1000)

  // gameStore.gameService.send({ type: "TO_OUTRO" });
  // console.log("Hello 3")
  // await sleep(1000)
  // gameStore.gameService.send({ type: "CHECK_END" });

  console.log("bye")

})

</script>

<style></style>