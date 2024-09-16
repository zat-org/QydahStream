<template>
  <div class="text-red-500">
    <div class="h-[90vh] flex flex-col border-2" >

      <FourPlayer v-show="table_data?.mode === 4" />
      <TwoPlayer v-show="table_data?.mode === 2" />

    </div>
  </div>
</template>

<script lang="ts" setup>

import {
  getFirestore,
  onSnapshot ,
  doc,
  updateDoc,
} from "firebase/firestore";
const db = getFirestore(useFirebaseApp());
const docRef = doc(db, "Tables", "OZdmebZwKUqsJS1Zia2Y");
const table_data =ref<any>(null)
const table  =   onSnapshot(docRef,(doc)=>{
  table_data.value= doc.data()
});

</script>

<style></style>
