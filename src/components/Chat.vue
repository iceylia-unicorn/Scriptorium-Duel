<template>
  <div class="flex flex-col ml-8 w-80 bg-[#141A30] rounded-2xl p-4 h-96">
    <div class="flex-1 overflow-y-auto mb-4 space-y-2 scrollbar" ref="messagesEnd">
      <div  v-for="(msg, index) in messages" :key="index"
           :class="['p-2 rounded-lg', msg.isSelf ? 'bg-[#2d575aff] ml-8' : 'bg-[#29355F] mr-8']">
        <p class="text-xs text-gray-300">{{ msg.sender }}</p>
        <p class="text-white">{{ msg.content }}</p>
        <p class="text-xs text-gray-400 text-right">{{ msg.time }}</p>
      </div>
    </div>

    <div class="flex space-x-2">
      <input v-model="newMessage" @keyup.enter="sendMessage"
             class="flex-1 px-3 py-2 bg-[#0E1324] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#34D0DE]"
             placeholder="输入消息...">
      <button @click="sendMessage"
              class="px-4 py-2 bg-[#34D0DE] hover:bg-[#21BDE0] text-black rounded-md transition-colors">
        发送
      </button>
    </div>
  </div>
</template>


<script lang="ts" setup>
import {inject, nextTick, ref} from "vue";
import {sendBattleMessage} from "../api/socket.js";
import type {EventEmitter} from "events";

const newMessage = ref('');
const messages = ref<Array<{
  content: string;
  sender: string;
  time: string;
  isSelf: boolean;
}>>([]);
const eventEmitter = inject("eventEmitter") as EventEmitter;
const messagesEnd = ref<HTMLElement | null>(null);
// 发送消息
const sendMessage = () => {
  if (!newMessage.value.trim()) return;
  const content = newMessage.value.trim();
  newMessage.value = '';
  messages.value.push({
    content: content,
    sender: '你',
    time: new Date().toLocaleTimeString(),
    isSelf: true
  });

  sendBattleMessage(content);
  nextTick(() => {
    if (messagesEnd.value) {
      messagesEnd.value.scrollTop = messagesEnd.value.scrollHeight;
    }
  });
};
eventEmitter.on('receiveMessage', (data: {
  content: string;
  sender: string;
  timestamp: string;
  isOpponent: boolean;
}) => {
  messages.value.push({
    content: data.content,
    sender: data.isOpponent ? '对手' : '你',
    time: new Date(data.timestamp).toLocaleTimeString(),
    isSelf: !data.isOpponent
  });

  nextTick(() => {
    const container =  messagesEnd.value as HTMLElement;
    container.scrollTop = container.scrollHeight;
  });
});
</script>

<style scoped>
/* 自定义滚动条样式 */
.scrollbar::-webkit-scrollbar {
  @apply w-2; /* 滚动条宽度 */
}

.scrollbar::-webkit-scrollbar-track {
  @apply bg-[#0E1324] rounded-full; /* 轨道颜色 */
}

/*箭头部分*/
.scrollbar::-webkit-scrollbar-thumb {
  @apply bg-[#29355F] rounded-full hover:bg-[#34D0DE]; /* 滑块颜色及悬停状态 */
}
/* Firefox兼容 */
.scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #29355F #0E1324;
}
</style>