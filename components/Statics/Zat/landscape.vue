<template>

  <table class=" rounded-xl text-center table-fixed table-pin-rows my-3 shadow-lg">
    <thead>
      <tr class="h-12 text-xs">
        <th class=" ">
          {{ game!.usName }}
        </th>
        <th style="width: 20%">
          <UIcon name="fxemoji:squaredvs" class="text-2xl" />
        </th>
        <th class="">
          {{ game!.themName }}
        </th>
      </tr>
    </thead>

    <tbody>
      <tr class="h-8 ">
        <td class="font-semibold   ">
          {{ statusUs?.moshtaraSunCount }}
        </td>
        <td class="px-0 text-sm">مشترى صن</td>
        <td class="font-semibold ">
          {{ statusThem?.moshtaraSunCount }}
        </td>
      </tr>

      <tr class="h-8 ">
        <td class="font-semibold ">
          {{ statusUs?.moshtaraHokmCount }}
        </td>
        <td class="px-0 text-sm">مشترى حكم</td>
        <td class="font-semibold ">
          {{ statusThem?.moshtaraHokmCount }}
        </td>
      </tr>

      <tr class="h-8 ">
        <td class="font-semibold ">
          {{ statusUs?.wonMoshtaraCount }}
        </td>
        <td class="px-0 text-sm">مشتريات ناجحة</td>
        <td class="font-semibold ">
          {{ statusThem?.wonMoshtaraCount }}
        </td>
      </tr>

      <tr class="h-8 ">
        <td class="font-semibold ">
          {{ statusUs?.lostMoshtaraCount }}
        </td>
        <td class="px-0 text-xs">مشتريات خسرانة</td>
        <td class="font-semibold ">
          {{ statusThem?.lostMoshtaraCount }}
        </td>
      </tr>

      <tr class="h-8 ">
        <td class="font-semibold ">
          {{ statusUs?.sra }}
        </td>
        <td class="px-0 text-sm">سرا</td>
        <td class="font-semibold ">
          {{ statusThem?.sra }}
        </td>
      </tr>

      <tr class="h-8 ">
        <td class="font-semibold ">
          {{ statusUs?.baloot }}
        </td>
        <td class="px-0 text-sm">بلوت</td>
        <td class="font-semibold ">
          {{ statusThem?.baloot }}
        </td>
      </tr>

      <tr class="h-8 ">
        <td class="font-semibold ">
          {{ statusUs?.khamsen }}
        </td>
        <td class="px-0 text-sm">خمسين</td>
        <td class="font-semibold ">
          {{ statusThem?.khamsen }}
        </td>
      </tr>

      <tr class="h-8 ">
        <td class="font-semibold ">
          {{ statusUs?.me2a }}
        </td>
        <td class="px-0 text-sm">مية</td>
        <td class="font-semibold ">
          {{ statusThem?.me2a }}
        </td>
      </tr>

      <tr class="h-8 ">
        <td class="font-semibold ">
          {{ statusUs?.rob3ome2a }}
        </td>
        <td class="px-0 text-sm">أربعمية</td>
        <td class="font-semibold ">
          {{ statusThem?.rob3ome2a }}
        </td>
      </tr>

      <tr class="h-8 ">
        <td class="font-semibold ">
          {{ statusUs?.sunKaboot }}
        </td>
        <td class="px-0 text-xs">عدد الكبابيت صن</td>
        <td class="font-semibold ">
          {{ statusThem?.sunKaboot }}
        </td>
      </tr>

      <!-- <tr class="h-8 ">
           <td class="font-semibold ">
             {{ statusUs?.hokmKaboot }}
           </td>
           <td class="px-0 text-xs">عدد الكبابيت حكم</td>
           <td class="font-semibold ">
             {{ statusThem?.hokmKaboot }}
           </td>
         </tr> -->
    </tbody>
  </table>

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
  gameStore.gameService.send({ type: "NEXT" });
  console.log("Hello 2")
  await sleep(1000)

  gameStore.gameService.send({ type: "TO_OUTRO" });
  console.log("Hello 3")
  await sleep(1000)
  gameStore.gameService.send({ type: "CHECK_END" });

  console.log("bye")

})

</script>

<style></style>