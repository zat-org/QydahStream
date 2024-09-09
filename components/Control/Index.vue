<template>
  <div v-if="table_data">{{table_data }}</div>

  <button @click="update(2)">2 mode</button>
  <br />

  <button @click="update(4)">4 mode</button>
</template>

<script lang="ts" setup>
import {
  getFirestore,
  onSnapshot ,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useDocument } from "vuefire";
const props = defineProps<{ id: string }>();
const db = getFirestore(useFirebaseApp());
const docRef = doc(db, "Tables", "OZdmebZwKUqsJS1Zia2Y");
const table_data =ref<any>(null)
const table =   onSnapshot(docRef,(doc)=>{
  table_data.value= doc.data()
});


const update = (mode: number) => {
  const docRef = doc(db, "Tables", "OZdmebZwKUqsJS1Zia2Y");
  updateDoc(docRef, {
    mode: mode,
  });
};
</script>

<style></style>
