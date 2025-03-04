import { defineConfig, presetUno } from 'unocss'
import presetIcons from '@unocss/preset-icons'
export default defineConfig({
    presets: [
        presetUno(), // 默认预设
        presetIcons({
            scale: 1.2,
            warn: true
        })
    ]
})