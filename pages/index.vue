<template>
  <div class=" relative bg-transparent  w-[625px] h-[1350px] m-0 bg-red-300 flex flex-col justify-between " >
    <!-- <div class="absolute top-0 right-[50%] p-5 bg-blue-400 "> player1</div>
    <div class="absolute top-[100%] right-[50%] p-5 bg-blue-400" > player2</div>
    <div class="absolute top-[50%] left-0 p-5 bg-red-400" > player3</div>
    <div class="absolute top-[50%] left-[100%] p-5 bg-red-400"> player4 </div> -->

<div class ="flex justify-between items-center  w-full">
  <div class="p-5 bg-red-500"></div>
  <div class="p-5 bg-red-500"></div> 
</div>
<div class="text-2xl font-bold flex flex-col   items-center justify-center h-full w-full">
<!-- top -->
<div class="grow flex items-start "> 
<div class="p-5 text-white bg-black">
  top
</div>
</div>
<!-- right andleft -->
<div class="flex justify-between w-full">
  <div class="p-5 text-white bg-black"> left </div>
  <div class="p-5 text-white bg-black"> right</div>

</div>
<!-- bottoom -->
<div class="grow flex items-end ">
<div class="p-5 text-white bg-black">
  
  bottom
</div>
</div>

</div>



<div class ="flex justify-between items-center  w-full">
  <div class="p-5 bg-red-500"></div>
  <div class="p-5 bg-red-500"></div> 
</div>
  </div>
</template>

<script lang="ts" setup>

</script>

<style>

</style>