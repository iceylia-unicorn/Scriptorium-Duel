<template>
  <div class="flex-items-center m-20 p-10 bg-[#141A30]  rounded-2xl">
    <div v-if="roomStatus==='null'" class="space-y-4">
      <input type="text" placeholder="邀请码" v-model="roomId"
             class="block h-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50">

      <div class="flex items-center space-x-6">
        <div @click="handleCreateRoom"
             class="cursor-pointer hover:bg-[#21BDE0] bg-[#34D0DE] text-black py-2 rounded-md text-5  w-32 text-align-center tracking-widest">
          创建房间
        </div>
        <div @click="handleJoinRoom(roomId)"
             class="cursor-pointer hover:bg-[#21BDE0] bg-[#34D0DE] text-black py-2 rounded-md text-5  w-32 text-align-center tracking-widest">
          加入房间
        </div>
      </div>
    </div>
    <div v-else class="space-y-4">
      <p class="text-[#22D1F8]">邀请码: <span class="text-white rounded-l">{{ roomId }}</span></p>
      <div class="bg-black p-4 rounded-l">
        <p v-if="gameState.players.length !== 2">复制邀请码邀请好友加入</p>
        <div v-else>
          <p>{{ gameState.players[0] }}</p>
          <p>{{ gameState.players[1] }}</p>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// import {gameState} from "../../babylon/gameState.ts";
import {inject, onMounted, onUnmounted, ref} from "vue";
import {createDuelRoom, initializeSocket, joinDuelRoom} from "../../api/socket.ts";
import message from '../../utils/message'
import {gameState} from "../../babylon/gameState.ts";
import type {EventEmitter} from "events";
import { useRouter } from "vue-router";


const router = useRouter();

let roomId = ref<string>("");
let roomStatus = ref<"null" | "created" | "ready" | "started">("null");
const eventEmitter = inject("eventEmitter") as EventEmitter;

const handleCreateRoom = async () => {
  if (roomStatus.value !== "null") return; //房间存在
  await initializeSocket();
  createDuelRoom().then((res: { event: string, data: string }) => {

    roomStatus.value = "created";
    roomId.value = res.data;
    gameState.roomID = roomId.value;
    gameState.isOwner = true;
    message.success("创建成功")
  })
}

const handleJoinRoom = async (roomId: string) => {
  try {
    await initializeSocket();
    // const res: { event: string, data: string } = await joinDuelRoom(roomId);
    await joinDuelRoom(roomId);
    gameState.roomID = roomId;
    roomStatus.value = "ready";

    message.success("加入房间成功")


  } catch (err) {
    message.error(err as string + "，请检查邀请码");
  }
}

const handleGameStarted = ()=>{
  router.push("/mainscene");
  message.info("游戏开始");
}
onMounted(()=>{
  eventEmitter.on('gameStarted', handleGameStarted);
})
onUnmounted(()=>{
  eventEmitter.off('gameStarted', handleGameStarted);
})
</script>