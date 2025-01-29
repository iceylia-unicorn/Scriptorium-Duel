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
  <div id="overlay">
  </div>
  <div id="canvasZone">

    <canvas ref="bjsCanvas" width="500" height="500" />
  </div>
</template>

<style scoped>
/* CSS for the HTML elements */
#overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid #ccc;
}
</style>