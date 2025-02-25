<script setup lang="ts">


import {onMounted, ref} from "vue";
// import  {createScene} from "../scenes/MyFirstScene.ts"
import {createDuelRoom, initializeSocket, joinDuelRoom, sendInitDeck} from "../api/socket.ts";
import {Color3, Engine, MeshBuilder, Scene, SpotLight, StandardMaterial, Vector3} from "@babylonjs/core";
import {CameraManager} from "../scenes/CameraManager.ts";
import {CreateDeckMesh1, CreateDeckMesh2, TableManager} from "../scenes/DeckManager.ts";
import {Card, StoatCard} from "../scenes/Card.ts";
import {staticUrl} from "../api";
import {ability_strafe, ability_tristrike} from "../scenes/Card-database.ts";
import {gameState} from "../scenes/gameState.ts"

const bjsCanvas = ref<HTMLCanvasElement | null>(null);
let roomId = ref<string>("");

const handleCreateRoom = async () => {
  initializeSocket();
  createDuelRoom();
}

const handleJoinRoom = async (roomId: string) => {
  initializeSocket();
  joinDuelRoom(roomId);
}
onMounted(async () => {
  if (bjsCanvas.value) {
    const createScene = async (canvas: HTMLCanvasElement | null) => {
      const engine = new Engine(canvas);
      const scene = new Scene(engine);
      const cameraManager = new CameraManager(canvas, scene);
      const spotLight = new SpotLight(
          "spotLight",
          new Vector3(-1.673872709274292, 18.254297256469727, -14.205820083618164),
          new Vector3(0.1972587775514061, -0.8802373725453397, 0.4315914070662226),
          10,
          4.14,
          scene);
      spotLight.intensity = 100;
      spotLight.diffuse = new Color3(0.8156862745098039, 0.6313725490196078, 0.38823529411764707);
      // create skybox, which is indeed a infinite distance box without reflection.
      const skybox = MeshBuilder.CreateBox("skyBox", {size:150}, scene);
      const skyboxMaterial = new StandardMaterial("skybox", scene);
      skyboxMaterial.diffuseColor = Color3.Black();
      skyboxMaterial.backFaceCulling = false;
      skyboxMaterial.disableLighting = true;
      skybox.material = skyboxMaterial;
      //set render priority, id 0 means render 1st.
      skybox.renderingGroupId = 0;

      new TableManager(scene);
      const deckManager = CreateDeckMesh1(scene, cameraManager);

      const squirrelDeckManager = CreateDeckMesh2(scene);


      const stoat = StoatCard.Create(scene);
      stoat.box.position.x = 5;

      stoat.show();
      // stoat.changeName("长老白鼬");
      // stoat.startTalkAnimate();


      const ant = new Card(scene, "bat", "1", "1", "1", staticUrl + "images/cards/portraits/portrait_lice.png",2, [ability_strafe,ability_tristrike]);
      ant.box.position = new Vector3(1.8832770407085523e-16, -4.578444004058838, 1.407560110092163);// (debugNode as BABYLON.Mesh)
      ant.box.rotation  = new Vector3(1.1502502007897775, 3.141592653589793, 3.141592653589793);// (debugNode as BABYLON.Mesh)
      ant.hide();
      ant.show();
      ability_tristrike.addFun(ant);
      ability_tristrike.addFun(ant);

      const ant2 = new Card(scene, "bat", "1", "1", "1", staticUrl + "images/cards/portraits/portrait_lice.png",2, [ability_strafe,ability_tristrike]);
      const ant3 = new Card(scene, "bat", "1", "1", "1", staticUrl + "images/cards/portraits/portrait_lice.png",2, [ability_strafe,ability_tristrike]);

      sendInitDeck(gameState.selfInitDeck);

      deckManager.initDeck([ant, stoat,ant2, ant3]);
      // deckManager1.updateDeck(20);
      squirrelDeckManager.initSquirrelDeck(15);

      if (import.meta.env.MODE === 'development') {
        await import('@babylonjs/inspector');
        await scene.debugLayer.show();
      }
      engine.runRenderLoop(() => {
        scene.render();
      });

    }
    await createScene(bjsCanvas.value);
  }
});


</script>

<template>

  <div>
    <input type="text" v-model="roomId"/>
    <button @click="handleCreateRoom">创建</button>
    <button @click="handleJoinRoom(roomId)">提交</button>
    <span v-if="gameState.roomid">房间id: {{ gameState.roomid }}</span>
  </div>
  <div class="flex-items-center">
    <canvas class="outline-none"  ref="bjsCanvas" width="1080" height="607.5" />
  </div>
</template>

<style scoped>

</style>