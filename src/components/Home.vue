<template>
  <nav class="w-full flex flex-col flex-items-center c-gray">
    <div class="w-full h-20 flex flex-items-center text-xl">
      <div @click=" NavigateTo('/room')" class="flex flex-items-center w-1/7 p-12 h-1/1 decoration-none">
        <img src="/logo.png" class="w-15 cursor-pointer object-contain" alt="">
<!--        <span class="cursor-pointer">图标</span>-->
      </div>
      <div  class="w-6/7 p-1">
        <ul class="list-none flex space-x-12">
          <li :class="{ 'text-[#91A7DC]': $route.path === '/room' }" class="cursor-pointer" @click="NavigateTo('/room')">房间</li>
<!--          <li :class="{ 'text-[#91A7DC]': $route.path === '/mainscene' }" class="cursor-pointer" @click="NavigateTo('/mainscene')">对战窗口</li>-->
        </ul>
      </div>
      <div class="w-1/7 p-10">
        我的
      </div>
    </div>
    <router-view></router-view>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
const router = useRouter();
const NavigateTo = (des:string)=>{
  router.push(des);
}
</script>