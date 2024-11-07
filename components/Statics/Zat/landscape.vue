<template>
  <div class=" w-[1920px] h-[1080px] flex  justify-center ">
    <!--header   -->
    <div  id="dataHolder"class=" flex flex-col gap-2   rounded-[50px] pb-[30px] overflow-hidden  w-[50%]  bg-gradient-to-b   from-zinc-700/55  to-zinc-600/55   my-auto ">
      
      <div class= " relative  h-[100px]  flex justify-evenly  items-center text-3xl ">
        <!-- <div class="w-[85%] absolute h-[20px] bg-white top-[-10px] rounded-xl"></div> -->
        <img id="headerBg" class="absolute w-full "  src="~/assets/svg/headerbg.svg" alt="">
        <p  id="themHead" class="z-[10]  text-white font-semibold"  > {{game?.themName}}</p>
        <div id="vsHead" class="relative  w-[100px] h-[100px] z-[10]  top-[-14px] flex justify-center items-center ">
          <img    src="~/assets/svg/vsbg_g1.svg" class="   absolute " />
            <p class=" absolute z-[20] top-[10px] text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500  " >vs </p>
        </div>
        <p id="usHead" class="  z-[10] text-white font-semibold"> {{game?.usName}}</p>
      </div>
      
      <div class="flex flex-col gap-5 mt-5  text-xl text-white font-semibold  ">
        <div class="row-bg  flex justify-around  items-center  ">
          <p class="themData"> {{statusThem?.moshtaraSunCount}} </p>
          <p class="titleData">مشترى صن </p>
          <p class="usData">  {{statusUs?.moshtaraSunCount}} </p>
        </div>

        <div class="row-bg   flex justify-around  items-center ">
          <p class="themData"> {{statusThem?.moshtaraHokmCount}} </p>
          <p class="titleData">مشترى حكم</p>
          <p class="usData"> {{statusUs?.moshtaraHokmCount}} </p>
        </div>

        <div class="row-bg   flex justify-around  items-center ">
          <p class="themData"> {{statusThem?.wonMoshtaraCount}} </p>
          <p class="titleData">مشتريات ناجحة</p>
          <p class="usData"> {{statusUs?.wonMoshtaraCount}} </p>
        </div>

        <div class="row-bg   flex justify-around  items-center ">
          <p class="themData"> {{statusThem?.lostMoshtaraCount}}  </p>
          <p class="titleData"> مشتريات خسرانة</p>
          <p class="usData"> {{statusUs?.lostMoshtaraCount}}  </p>
        </div>

        <div class="row-bg  flex justify-around  items-center ">
          <p class="themData">  {{statusThem?.sra}} </p>
          <p class="titleData"> سرا</p>
          <p class="usData">  {{statusUs?.sra}}  </p>
        </div>
        
        <div class="row-bg   flex justify-around  items-center ">
          <p class="themData">  {{statusThem?.baloot}} </p>
          <p class="titleData"> بلوت</p>
          <p class="usData">  {{statusUs?.baloot}} </p>
        </div>
          
        <div class="row-bg   flex justify-around  items-center ">
          <p class="themData">  {{statusThem?.khamsen}} </p>
          <p class="titleData"> خمسين</p>
          <p class="usData">  {{statusUs?.khamsen}} </p>
        </div>

        <div class="row-bg   flex justify-around  items-center ">
          <p class="themData">  {{statusThem?.me2a}} </p>
          <p class="titleData"> مية</p>
          <p class="usData">  {{statusUs?.me2a}} </p>
        </div>
          
        <div class="row-bg flex justify-around  items-center ">
          <p class="themData"> {{statusThem?.rob3ome2a}} </p>
          <p class="titleData"> أربعمية</p>
          <p class="usData">  {{statusUs?.rob3ome2a}} </p>
        </div>
          
        <div class="row-bg   flex justify-around  items-center ">
          <p class="themData"> {{statusThem?.sunKaboot}} </p>
          <p class="titleData"> عدد الكبابيت صن</p>
          <p class="usData">  {{statusUs?.sunKaboot}} </p>
        </div>
          
        </div>

      

      </div>


    
    </div>

  </template>

<script lang="ts" setup>
import gsap from "gsap";
const {sleep} = useSleep()
const t1 = gsap.timeline();

const enterAnimation = ()=>{  
  t1.fromTo( "#dataHolder",{opacity:0 },{opacity:1,duration:.5})
  .fromTo( "#headerBg",{scaleX:0 , transformOrigin:'center' },{scaleX:1,duration:.5})
  .fromTo("#themHead",{scaleY:0 ,transformOrigin:'top'},{scaleY:1,duration:.25},'>')
  .fromTo("#usHead",{scaleY:0 ,transformOrigin:'top'},{scaleY:1,duration:.25},'<')
  .fromTo("#vsHead",{scaleY:0 ,transformOrigin:'top'},{scaleY:1,duration:.25},'<')
  .fromTo(".row-bg",{opacity:0 },{opacity:1,duration:.5},'>')
  .fromTo(".titleData",{scaleY:0 ,transformOrigin:'top'},{scaleY:1,duration:.5},'<')
  .fromTo(".themData",{scaleX:0 ,transformOrigin:'left'},{scaleX:1,duration:.5},'>')
  .fromTo(".usData",{scaleX:0 ,transformOrigin:'right'},{scaleX:1,duration:.5},'<')

}
const outAnimation = () => {
  t1.timeScale(2) 
  t1.reverse()
};

// onMounted(async()=>{
//   enterAnimation()
// await sleep(5*1000)
//   outAnimation()
// })

const gameStore = useMyGameStore()
const {statics, game } = storeToRefs(gameStore)

const statusUs = computed(() => {
  if (statics.value)
    return statics.value.usStatistics;
});
const statusThem = computed(() => {
  if (statics.value)
    return statics.value.themStatistics;
});


onMounted(async () => {

  
  enterAnimation()
  // await sleep(4000)
  
  // gameStore.gameService.send({ type: "NEXT" });
  
  // gameStore.gameService.send({ type: "TO_OUTRO" });
  // outAnimation()
  // await sleep(2000)
  // gameStore.gameService.send({ type: "CHECK_END" });

  

})

</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&display=swap');

*{
  font-family: Cairo
}
.row-bg{
  @apply bg-gradient-to-r  even:from-zinc-700/20  from-20%  even:via-zinc-600/20  via-45%  even:to-zinc-700/20   to-80%
                           odd:from-zinc-600/20        odd:via-zinc-700/20              odd:to-zinc-600/20  ;
  @apply  py-2
   

}
.themData {
  @apply ml-[20px] mr-auto
}
.usData {
  @apply mr-[20px] ml-auto
}
</style>