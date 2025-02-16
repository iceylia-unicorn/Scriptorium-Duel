<script setup lang="ts">


import {onMounted, ref} from "vue";
import  {createScene} from "../scenes/MyFirstScene.ts"
import {createDuelRoom, joinDuelRoom} from "../api/socket.ts";

const bjsCanvas = ref<HTMLCanvasElement | null>(null);
let roomId = ref<string>("");
onMounted(async () => {
  if (bjsCanvas.value) {
    await createScene(bjsCanvas.value);
  }
});


</script>

<template>
  <div>
    <input type="text" v-model="roomId"/>
    <button @click="createDuelRoom">创建</button>
    <button @click="joinDuelRoom(roomId)">提交</button>

  </div>
  <div id="canvasZone">

    <canvas ref="bjsCanvas" width="1080" height="607.5" />
  </div>
</template>

<style scoped>
#canvasZone{
  display: flex;
  flex-direction: row;
  align-items: center;
}
</style>