<template>
  <div>
    <NuxtPage />
    <QydahErrorLogPanel v-if="showErrorPanel" />
  </div>
</template>
<script setup lang="ts">
const route = useRoute();
const showErrorPanel = computed(
  () => route.query.debugErrors === "1" || route.query.debugErrors === "true",
);
</script>
<style>

</style>
