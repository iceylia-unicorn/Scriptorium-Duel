import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import 'virtual:uno.css'
import router from "./router"
import message from './utils/message.ts'
import {provideEventEmitter} from "./api/socket.ts";

const app = createApp(App);
app.config.globalProperties.$message = message;
provideEventEmitter(app); //提供事件触发器

app.use(router).mount('#app');

