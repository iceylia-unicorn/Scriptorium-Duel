import { createRouter, createWebHashHistory } from 'vue-router'
import Room from "../components/Room/Room.vue";
import MainScene from "../components/MainScene.vue";
import {gameState} from "../babylon/gameState.ts";
const routes = [
    {
        path: '/',
        name: 'Home',
        redirect: '/room',
        // component: Home
    },
    {
        path: '/room',
        component: Room
    },
    {
        path: '/mainscene',
        component: MainScene,
        meta: { requiresAuth: true }
    }
];



const router = createRouter({
    history: createWebHashHistory(), // history模式， createWebHashHistory为hash模式。
    routes
})

router.beforeEach((to, from, next) => {
    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (!gameState.roomID || gameState.roomID.trim() === "") {
            next('/room')
        } else {
            next() // 正常放行
        }
    } else {
        next() // 不需要验证的路由直接放行
    }
})
export default router;