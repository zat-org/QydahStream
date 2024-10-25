<template>
  <div class="flex flex-col justify-between">
    <div class="flex justify-between items-center p-5">



      <div class="relative w-[140px] h-[195px]" v-if="top && top.url">
        <img class="w-[140px] h-[195px] absolute z-[10]" src='/images/zat/usframe.svg' />
        <img :src="top?.url" class="w-[140px] h-[187px] object-cover object-center  absolute  rounded-2xl top-[5px]" />
      </div>
      <div v-else>
      </div>


      <div class="relative w-[140px] h-[195px]" v-if="right && right.url">
        <img class="w-[140px] h-[195px] absolute z-[10] " src='/images/zat/themframe.svg' />
        <img :src="right?.url" class="w-[140px] h-[187px] object-cover object-center absolute top-[5px] rounded-2xl" />
      </div>
      <div v-else>
      </div>




    </div>
    <div class="flex justify-between items-center p-5">


      <div class="relative w-[140px] h-[195px] " v-if="left && left.url">
        <img class="w-[140px] h-[195px]  absolute z-[10]" src='/images/zat/themframe.svg' />
        <img :src="left?.url" class="w-[140px] h-[187px] absolute object-cover object-center  rounded-2xl top-[5px]" />
      </div>
      <div v-else>
      </div>



      <div class="relative w-[140px] h-[195px]" v-if="bottom && bottom.url">
        <img class="w-[140px] h-[195px]  absolute z-[10]" src='/images/zat/usframe.svg' />
        <img :src="bottom?.url" class="w-[140px] h-[187px] object-cover object-center absolute rounded-2xl  top-[5px]" />
      </div>
      <div v-else>
      </div>


    </div>

  </div>

</template>

<script lang="ts" setup>
const gamestore = useMyGameStore();
const { game } = storeToRefs(gamestore);
// game.value?.themPlayers
// game.value?.usPlayers
console.log("Hello")

const top = computed(() => {

  if (game.value?.themPlayers.length! > 0)
    return game.value?.usPlayers[0]
})

const bottom = computed(() => {
  if (game.value?.themPlayers.length! > 0)
    return game.value?.usPlayers[1]
})

const left = computed(() => {
  if (game.value?.themPlayers.length! > 0)
    return game.value?.themPlayers[1]
})
const right = computed(() => {
  if (game.value?.themPlayers.length! > 0)
    return game.value?.themPlayers[0]
})
console.log("bottom", bottom.value)
console.log("top", top.value)
console.log("left", left.value)
console.log("right", right.value)



</script>

<style>

</style>