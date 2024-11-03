<template>

  <table class="w-full rounded-xl text-center table-fixed table-pin-rows my-3 shadow-lg">
    <thead>
      <tr class="h-12 bg-gray-200 dark:bg-slate-700 text-xs">
        <th class="text-gray-900 dark:text-white ">
          {{ game!.usName }}
        </th>
        <th style="width: 20%">
          <UIcon name="fxemoji:squaredvs" class="text-2xl" />
        </th>
        <th class="text-gray-900 dark:text-white ">
          {{ game!.themName }}
        </th>
      </tr>
    </thead>
    <tbody>

      <tr class="h-8 even:dark:bg-slate-500 odd:dark:bg-slate-600 even:bg-slate-50 odd:bg-slate-100">
        <td class="font-semibold text-md text-blue-950 dark:text-slate-50">
          {{ statusUs?.moshtaraSunCount }}
        </td>
        <td class="px-0 text-sm">مشترى صن</td>
        <td class="font-semibold text-md text-blue-950 dark:text-slate-50">
          {{ statusThem?.moshtaraSunCount }}
        </td>
      </tr>

      <tr class="h-8 even:dark:bg-slate-500 odd:dark:bg-slate-600 even:bg-slate-50 odd:bg-slate-100">
        <td class="font-semibold text-md text-blue-950 dark:text-slate-50">
          {{ statusUs?.moshtaraHokmCount }}
        </td>
        <td class="px-0 text-sm">مشترى حكم</td>
        <td class="font-semibold text-md text-blue-950 dark:text-slate-50">
          {{ statusThem?.moshtaraHokmCount }}
        </td>
      </tr>

      <tr class="h-8 even:dark:bg-slate-500 odd:dark:bg-slate-600 even:bg-slate-50 odd:bg-slate-100">
        <td class="font-semibold text-md text-blue-950 dark:text-slate-50">
          {{ statusUs?.wonMoshtaraCount }}
        </td>
        <td class="px-0 text-sm">مشتريات ناجحة</td>
        <td class="font-semibold text-md text-blue-950 dark:text-slate-50">
          {{ statusThem?.wonMoshtaraCount }}
        </td>
      </tr>

      <tr class="h-8 even:dark:bg-slate-500 odd:dark:bg-slate-600 even:bg-slate-50 odd:bg-slate-100">
        <td class="font-semibold text-md text-blue-950 dark:text-slate-50">
          {{ statusUs?.lostMoshtaraCount }}
        </td>
        <td class="px-0 text-xs">مشتريات خسرانة</td>
        <td class="font-semibold text-md text-blue-950 dark:text-slate-50">
          {{ statusThem?.lostMoshtaraCount }}
        </td>
      </tr>

      <tr class="h-8 even:dark:bg-slate-500 odd:dark:bg-slate-600 even:bg-slate-50 odd:bg-slate-100">
        <td class="font-semibold text-md text-blue-950 dark:text-slate-50">
          {{ statusUs?.sra }}
        </td>
        <td class="px-0 text-sm">سرا</td>
        <td class="font-semibold text-md text-blue-950 dark:text-slate-50">
          {{ statusThem?.sra }}
        </td>
      </tr>

      <tr class="h-8 even:dark:bg-slate-500 odd:dark:bg-slate-600 even:bg-slate-50 odd:bg-slate-100">
        <td class="font-semibold text-md text-blue-950 dark:text-slate-50">
          {{ statusUs?.baloot }}
        </td>
        <td class="px-0 text-sm">بلوت</td>
        <td class="font-semibold text-md text-blue-950 dark:text-slate-50">
          {{ statusThem?.baloot }}
        </td>
      </tr>

      <tr class="h-8 even:dark:bg-slate-500 odd:dark:bg-slate-600 even:bg-slate-50 odd:bg-slate-100">
        <td class="font-semibold text-md text-blue-950 dark:text-slate-50">
          {{ statusUs?.khamsen }}
        </td>
        <td class="px-0 text-sm">خمسين</td>
        <td class="font-semibold text-md text-blue-950 dark:text-slate-50">
          {{ statusThem?.khamsen }}
        </td>
      </tr>

      <tr class="h-8 even:dark:bg-slate-500 odd:dark:bg-slate-600 even:bg-slate-50 odd:bg-slate-100">
        <td class="font-semibold text-md text-blue-950 dark:text-slate-50">
          {{ statusUs?.me2a }}
        </td>
        <td class="px-0 text-sm">مية</td>
        <td class="font-semibold text-md text-blue-950 dark:text-slate-50">
          {{ statusThem?.me2a }}
        </td>
      </tr>

      <tr class="h-8 even:dark:bg-slate-500 odd:dark:bg-slate-600 even:bg-slate-50 odd:bg-slate-100">
        <td class="font-semibold text-md text-blue-950 dark:text-slate-50">
          {{ statusUs?.rob3ome2a }}
        </td>
        <td class="px-0 text-sm">أربعمية</td>
        <td class="font-semibold text-md text-blue-950 dark:text-slate-50">
          {{ statusThem?.rob3ome2a }}
        </td>
      </tr>

      <tr class="h-8 even:dark:bg-slate-500 odd:dark:bg-slate-600 even:bg-slate-50 odd:bg-slate-100">
        <td class="font-semibold text-md text-blue-950 dark:text-slate-50">
          {{ statusUs?.sunKaboot }}
        </td>
        <td class="px-0 text-xs">عدد الكبابيت صن</td>
        <td class="font-semibold text-md text-blue-950 dark:text-slate-50">
          {{ statusThem?.sunKaboot }}
        </td>
      </tr>

      <!-- <tr class="h-8 even:dark:bg-slate-500 odd:dark:bg-slate-600 even:bg-slate-50 odd:bg-slate-100">
           <td class="font-semibold text-md text-blue-950 dark:text-slate-50">
             {{ statusUs?.hokmKaboot }}
           </td>
           <td class="px-0 text-xs">عدد الكبابيت حكم</td>
           <td class="font-semibold text-md text-blue-950 dark:text-slate-50">
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