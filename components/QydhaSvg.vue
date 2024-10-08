<template >


<SVGScore/>
    

</template>

<script lang="ts" setup>
import gsap from "gsap";
const {sleep} =useSleep()
// document.addEventListener('mousemove', (event) => {
//   const x = event.clientX;  // Get the horizontal coordinate
//   const y = event.clientY;  // Get the vertical coordinate

//   console.log(`X: ${x}, Y: ${y}`);
// });

import SVGScore from '~/public/SVG/score.svg?component' 
const t1 = gsap.timeline();
const shapes = [".Shape4", ".Shape3", ".Shape2", ".Shape1"];
 const enteranimation = () => {
  t1.fromTo(".Logo", { y: 30 }, { y: 0, opacity: 1, duration: .5 })
    .fromTo (".Bar",{opacity:1 ,scaleY:0,transformOrigin: "bottom center" },{scaleY:1 ,duration:.5},"-=.2")
    .to(shapes, { opacity: 1, stagger: 0.1 },"<" )
    .fromTo(".RightArm .Orange", { scaleX: 0,opacity: 1 }, {scaleX: 1, duration: 1 },">")
    .fromTo(
      ".LeftArm .Orange",
      { scaleX: 0,opacity: 1 ,transformOrigin: "center right"},
      {  duration: 1 ,scaleX:1 },
      "<"
    )
    .fromTo(
      ".RightArm .Blue",
      { scaleX:0, opacity: 1,transformOrigin: "center left" },
      {scaleX: 1, duration: 1 },
      "-=.8"
    )
    .fromTo(".LeftArm .Blue",  { scaleX: 0,opacity: 1 ,transformOrigin: "center right"}, {  duration: 1 ,scaleX:1 }, "<")
    .fromTo(".ScoreArea", { scaleX: 0,opacity:1, duration: 1, transformOrigin: "center center" },{scaleX:1}, "<");
};
 const outAnimation = () => {
  t1.timeScale(2)
   
  t1.reverse()
};

defineExpose({
  enteranimation ,outAnimation
})

</script>

<style scoped>
.Bar,
.Logo,
.RightArm .Blue,
.RightArm .Orange,
.LeftArm .Blue,
.LeftArm .Orange,
.ScoreArea,
.Shape1,
.Shape2,
.Shape3,
.Shape4 {
  @apply opacity-0;
}
</style>
