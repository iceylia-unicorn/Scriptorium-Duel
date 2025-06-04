import {Engine, Scene} from "@babylonjs/core";
import { AdvancedDynamicTexture } from "@babylonjs/gui";
// 全局 BabylonJS 状态
export const globalBabylon = {
    // canvas: ref<HTMLCanvasElement | null>(null),
    canvas: null as HTMLCanvasElement | null,
    scene: null as Scene | null,
    advancedTexture: null as AdvancedDynamicTexture | null,
    engine: null as Engine| null
}