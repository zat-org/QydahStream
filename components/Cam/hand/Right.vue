<template>
  <div class="flex flex-col justify-between">
    <div class="flex justify-between items-center p-5">


      <div class="relative w-[140px] h-[195px] " v-if="left && ( left.imageUrl)">
        <img class="w-[140px] h-[195px] absolute z-[10]" src='/images/zat/themframe.svg' />
        <img :src="left?.imageUrl" class="w-[140px] h-[187px] absolute object-cover object-center rounded-2xl top-[5px]" />
      </div>
      <div v-else>
      </div>


      <div class="relative w-[140px] h-[195px]" v-if="top && top.imageUrl">
        <img class="w-[140px] h-[195px] absolute z-[10]" src='/images/zat/usframe.svg' />
        <img :src="top?.imageUrl" class="w-[140px] h-[187px] absolute  object-cover object-center rounded-2xl top-[5px]" />
      </div>
      <div v-else>
      </div>



    </div>
    <div class="flex justify-between items-center p-5">

      <div class="relative w-[140px] h-[195px]" v-if="bottom && bottom.imageUrl">
        <img class="w-[140px] h-[195px]  absolute z-[10]" src='/images/zat/usframe.svg' />
        <img :src="bottom?.imageUrl" class="w-[140px] h-[187px] object-cover object-center absolute rounded-2xl  top-[5px]" />
      </div>
      <div v-else>
      </div>



      <div class="relative w-[140px] h-[195px]" v-if="right && right.imageUrl">
        <img class="w-[140px] h-[195px]  absolute z-[10] " src='/images/zat/themframe.svg' />
        <img :src="right?.imageUrl" class="w-[140px] h-[187px]  object-cover object-center absolute top-[5px] rounded-2xl" />
      </div>
      <div v-else>
      </div>



    </div>

  </div>

</template>

<script lang="ts" setup>
const store  = useMyHandGameStore();


const { top,bottom,left,right } = storeToRefs(store);  



</script>

<style></style>