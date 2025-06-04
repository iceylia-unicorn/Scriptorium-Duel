<script setup lang="ts">
import {globalBabylon} from "../babylon/globals.ts"; // 初始化全局变量。
import "@babylonjs/loaders/glTF";
// import "@babylonjs/loaders";
import {onBeforeMount, onBeforeUnmount, onMounted, ref} from "vue";
import {eventEmitter, sendInitDeck} from "../api/socket.ts";
import {
  ActionManager, Animation,
  AssetContainer, Color3, DynamicTexture,
  Engine,
  ExecuteCodeAction,
  loadAssetContainerAsync, MeshBuilder, Quaternion,
  Scene, StandardMaterial, TransformNode,
  Vector3
} from "@babylonjs/core";

import {CameraManager, VIEWSTATUS} from "../babylon/CameraManager.ts";
import {DeckManager} from "../babylon/DeckManager.ts";
import {Card} from "../babylon/Card.ts";
import {gameState} from "../babylon/gameState.ts"
import {BattleManager} from "../babylon/BattleManager.ts";
import {TableManager} from "../babylon/TableManager.ts";
import MessageQueue, {parchment} from "../babylon/GUIMessageSystem.ts";
import {AdvancedDynamicTexture} from "@babylonjs/gui";
import {ability_flying, CARD_NAMES, loadImage} from "../babylon/Card-database.ts";
import {LightManager} from "../babylon/LightManager.ts";
import {EventSystem} from "../babylon/EventSystem.ts";
import Chat from "./Chat.vue";
import {staticUrl} from "../api";
// import {disposeMessageSystem, initGUIMessageSystem, showGUIText} from "../babylon/GUIMessageSystem.ts";
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
  LightManager.reset();
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
      globalBabylon.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
      parchment.init("imgs/parchment.jpg");

      LightManager.getInstance(); // 灯光初始化

      const tableManager = TableManager.getInstance();
      // initGUIMessageSystem(scene);

      CameraManager.getInstance();

      // 需要放在初始化之后，等待异步之前调用，否则会导致渲染被阻塞。
      engine.runRenderLoop(() => {
        scene.render();
      });
      if (import.meta.env.MODE === 'development') {
        await import('@babylonjs/inspector');
        await scene.debugLayer.show();
      }
      const selfCards = gameState.selfInitDeck.map(card => {
        return Card.Create(scene, card.name, card.id);
      });
      sendInitDeck(gameState.selfInitDeck);

      await tableManager.layoutCardsGrid(selfCards);
      await MessageQueue.getInstance().showMessage("这是你的初始卡牌", () => {
        Card.hideAll(selfCards);
      });
      if (gameState.opponentDeck.length <= 0) {
        // 等待接收到卡牌。
        DeckManager.opponentCards = await new Promise(resolve => {
          eventEmitter.once('opponentDeckReceived', () => {
            resolve(gameState.opponentDeck.map((card: any) =>
                Card.Create(scene, card.name, card.id)
            ))
          });
        });
      } else {
        DeckManager.opponentCards = await new Promise(resolve => {
          resolve(gameState.opponentDeck.map((card: any) =>
              Card.Create(scene, card.name, card.id)))
        })
      }

      const creatureDeck = DeckManager.getCreatureInstance();
      const squirrelDeck = DeckManager.getSquirrelInstance();
      creatureDeck.initDeck(selfCards);
      squirrelDeck.initSquirrelDeck(15);


      // await EventSystem.getInstance().showEvents(3);

      await tableManager.layoutCardsGrid(DeckManager.opponentCards);

      await MessageQueue.getInstance().showMessage("这是对手的初始卡组", () => {
        Card.hideAll(DeckManager.opponentCards);
      });

      const battleManager = await BattleManager.getInstance();
      battleManager.setEnabled(true);
      CameraManager.getInstance().unlockOverlook();

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
});

</script>

<template>
  <div class="w-full justify-center flex p-10 space-x-12">
    <div>
      <p>己方血量：{{ gameState.selfHP }}</p>
      <p>敌方血量：{{ gameState.opponentHP }}</p>
      <p class="align-mid"><span class="i-pixelarticons:coin w-5 h-5 "></span>金币：{{ gameState.golds }}</p>
    </div>
    <div class="flex-items-center  p-3 bg-[#141A30] rounded-2xl">
      <canvas class="outline-none" tabindex="0" ref="bjsCanvas" width="1080" height="607.5"/>
    </div>
    <Chat></Chat>
  </div>



</template>