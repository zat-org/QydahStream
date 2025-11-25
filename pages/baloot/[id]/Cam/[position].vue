<template>
  <component :is="camComponent" id="camtest" class="w-[1920px] h-[1080px] px-[125px] py-[25px]  "  />
</template>

<script lang="ts" setup>
import CamTop from "../../../../components/Cam/baloot/Top.vue"
import CamRight from "../../../../components/Cam/baloot/Right.vue"
import CamLeft from "../../../../components/Cam/baloot/Left.vue"
import CamBottom from "../../../../components/Cam/baloot/Bottom.vue"


const route = useRoute()
const router = useRouter()
const table_id =
  (route.params.id as string) ?? "983365b7-c1dc-4c60-8131-8450ceb934db";
const game = useMyBalootGameStore();
const { gameService, initializeConnection } = game;
await initializeConnection();

// Allowed positions
const allowedPositions = ['top', 'left', 'right', 'bottom']

// Get the dynamic position parameter from the URL
let position = route.params.position as string

// Check if the position is valid, otherwise default to 'top'
if (!allowedPositions.includes(position)) {
  position = 'top'
  // Optionally, navigate to the default 'top' route
  router.replace(`/baloot/${table_id}/cam/top`)
}
const camComponent = computed(()=>{
  if (position.toLowerCase() == "top") return  CamTop
  else if(position.toLowerCase() == "left") return CamLeft
  else if(position.toLowerCase() == "right") return CamRight
  else if(position.toLowerCase() == "bottom") return CamBottom

})


</script>

<style></style>