import { createRouter, createWebHashHistory } from 'vue-router'
import Room from "../components/Room/Room.vue";
import MainScene from "../components/MainScene.vue";
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
        component: MainScene
    }
];



const router = createRouter({
    history: createWebHashHistory(), // history模式， createWebHashHistory为hash模式。
    routes
})
export default router;