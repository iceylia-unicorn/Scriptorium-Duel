import {Engine, Scene} from "@babylonjs/core";

// 全局 BabylonJS 状态
export const globalBabylon = {
    // canvas: ref<HTMLCanvasElement | null>(null),
    canvas: null as HTMLCanvasElement | null,
    scene: null as Scene | null,

    engine: null as Engine| null
}