import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Unocss from 'unocss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), Unocss()],
  server: {
    hmr: {
      overlay: true, //热更新启用完全刷新。
    }
  }
})
