import { defineConfig, presetWind3 } from 'unocss'
import presetIcons from '@unocss/preset-icons'
export default defineConfig({
    presets: [
        presetWind3(), // 默认预设
        presetIcons({
            scale: 1.2,
            warn: true
        })
    ]
})