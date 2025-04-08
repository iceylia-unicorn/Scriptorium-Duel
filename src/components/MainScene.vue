<script setup lang="ts">
import {globalBabylon} from "../babylon/globals.ts"; // 初始化全局变量。
import "@babylonjs/loaders/glTF";
// import "@babylonjs/loaders";
import {onBeforeMount, onBeforeUnmount, onMounted, ref} from "vue";
import {eventEmitter, sendInitDeck} from "../api/socket.ts";
import {Color3, Engine, MeshBuilder, Scene, SpotLight, StandardMaterial, Vector3} from "@babylonjs/core";

import {CameraManager, VIEWSTATUS} from "../babylon/CameraManager.ts";
import {DeckManager} from "../babylon/DeckManager.ts";
import {Card} from "../babylon/Card.ts";
import {gameState} from "../babylon/gameState.ts"
import {BattleManager} from "../babylon/BattleManager.ts";
import {TableManager} from "../babylon/TableManager.ts";
import {disposeMessageSystem, initGUIMessageSystem, showGUIText} from "../babylon/GUIMessageSystem.ts";

const bjsCanvas = ref<HTMLCanvasElement | null>(null);
onBeforeMount(() => {
  if (globalBabylon.scene) {
    globalBabylon.scene.dispose();
    globalBabylon.scene = null;
  }
  if (globalBabylon.engine) {
    globalBabylon.engine.dispose();
    globalBabylon.engine = null;
  }
  // 新增：重置所有单例管理器
  CameraManager.reset();
  TableManager.reset();
  DeckManager.reset();  // 如果DeckManager也需要重置的话
  BattleManager.reset();// 如果BattleManager也需要重置的话
  eventEmitter.removeAllListeners();//移出所有监听。
})
onMounted(async () => {
  if (bjsCanvas.value) {
    const createScene = async (canvas: HTMLCanvasElement | null) => {
      const engine = new Engine(canvas);
      const scene = new Scene(engine);
      // 保存到全局状态
      globalBabylon.engine = engine;
      globalBabylon.scene = scene;

      const spotLight = new SpotLight(
          "spotLight",
          new Vector3(-1.673872709274292, 18.254297256469727, -14.205820083618164),
          new Vector3(0.1972587775514061, -0.8802373725453397, 0.4315914070662226),
          10,
          4.14,
          scene);
      spotLight.intensity = 100;
      spotLight.diffuse = new Color3(0.8156862745098039, 0.6313725490196078, 0.38823529411764707);
      // create skybox, which is indeed an infinite distance box without reflection.
      const skybox = MeshBuilder.CreateBox("skyBox", {size: 150}, scene);
      const skyboxMaterial = new StandardMaterial("skybox", scene);
      skyboxMaterial.diffuseColor = Color3.Black();
      skyboxMaterial.backFaceCulling = false;
      skyboxMaterial.disableLighting = true;
      skybox.material = skyboxMaterial;
      //set render priority, id 0 means render 1st.
      skybox.renderingGroupId = 0;

      const tableManager = TableManager.getInstance();
      initGUIMessageSystem(scene);

      CameraManager.getInstance();

      // 需要放在初始化之后，等待异步之前调用，否则会导致渲染被阻塞。
      engine.runRenderLoop(() => {
        scene.render();
      });
      if (import.meta.env.MODE === 'development') {
        await import('@babylonjs/inspector');
        await scene.debugLayer.show();
      }
      // const stoat = StoatCard.Create(scene);
      //
      // stoat.show();
      // const ant = new Card(scene, "bat", "1", "1", "1", staticUrl + "images/cards/portraits/portrait_lice.png", 2, [ability_strafe, ability_tristrike]);
      // ant.box.position = new Vector3(1.8832770407085523e-16, -4.578444004058838, 1.407560110092163);// (debugNode as BABYLON.Mesh)
      // ant.box.rotation = new Vector3(1.1502502007897775, 3.141592653589793, 3.141592653589793);// (debugNode as BABYLON.Mesh)
      // ant.hide();
      // ant.show();
      // ability_tristrike.addFun(ant);
      // ability_tristrike.addFun(ant);
      const selfCards = gameState.selfInitDeck.map(card => {
        const instance = Card.Create(scene, card.name, card.id);
        return instance;
      });
      sendInitDeck(gameState.selfInitDeck);

      tableManager.layoutCardsGrid(selfCards);
      // showGUIText("这是你的初始卡牌", ()=>{Card.hideAll(selfCards)});
      //
      await showGUIText("这是你的初始卡牌", () => {
        Card.hideAll(selfCards);
      });
      if(gameState.opponentDeck.length<=0) {
        // 等待接收到卡牌。
        DeckManager.opponentCards = await new Promise(resolve => {
          eventEmitter.once('opponentDeckReceived', () => {
            resolve(gameState.opponentDeck.map((card: any) =>
                Card.Create(scene, card.name, card.id)

            ))
          });
        });
      }
      else{
        DeckManager.opponentCards = await new Promise(resolve => {
          resolve(gameState.opponentDeck.map((card: any) =>
              Card.Create(scene, card.name, card.id)))
        })
      }

      tableManager.layoutCardsGrid(DeckManager.opponentCards);

      await showGUIText("这是对手的初始卡组", () => {
        Card.hideAll(DeckManager.opponentCards);
      });
      const creatureDeck = DeckManager.getCreatureInstance();
      const squirrelDeck = DeckManager.getSquirrelInstance();
      creatureDeck.initDeck(selfCards);
      squirrelDeck.initSquirrelDeck(15);


      const battleManager = await BattleManager.getInstance();
      battleManager.setEnabled(true);
      // CameraManager.getInstance().unlockOverlook();
      CameraManager.getInstance().switchViewStatus(VIEWSTATUS.default);
      await new Promise(resolve => {setTimeout(resolve, 1000);});
      await battleManager.pendingPhase();


    }
    globalBabylon.canvas = bjsCanvas.value;
    await createScene(globalBabylon.canvas);
  }
});
// 关键：在组件卸载前清理资源
onBeforeUnmount(() => {
  if (globalBabylon.scene) {
    globalBabylon.scene.dispose();
    globalBabylon.scene = null;
  }
  if (globalBabylon.engine) {
    globalBabylon.engine.dispose();
    globalBabylon.engine = null;
  }
  disposeMessageSystem();
});

</script>

<template>
  <div class="flex-items-center m-10 p-3 bg-[#141A30] rounded-2xl">
    <canvas class="outline-none" ref="bjsCanvas" width="1080" height="607.5"/>
    <button @click="sendInitDeck(gameState.selfInitDeck)">发送卡组</button>
  </div>
</template>