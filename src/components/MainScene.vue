<script setup lang="ts">


import {onMounted, ref} from "vue";
import  {createScene} from "../scenes/MyFirstScene.ts"

// const BJS_CANVAS_WIDTH = 800;
// const BJS_CANVAS_HEIGHT = 600;
// import { ref, onMounted } from "@vue/runtime-core";
const bjsCanvas = ref<HTMLCanvasElement | null>(null);


onMounted(async () => {
  if (bjsCanvas.value) {
    await createScene(bjsCanvas.value);
  }
});

</script>

<template>
  <div id="canvasZone">

    <canvas ref="bjsCanvas" width="1080" height="607.5" />
  </div>
</template>

<style scoped>
#canvasZone{
  display: flex;
  flex-direction: row;
  align-items: center;
  //justify-content: center;
  //width: 100%;
  //margin: 10px;
}
</style>