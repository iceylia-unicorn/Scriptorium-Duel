import {
    Color3,
    MeshBuilder,
    RectAreaLight,
    ShadowGenerator,
    SpotLight,
    StandardMaterial,
    Vector3
} from "@babylonjs/core";
import {globalBabylon} from "./globals.ts";

export class LightManager{
    private static instance: LightManager;
    public shadowGenerator: ShadowGenerator;
    private spotLight: SpotLight;
    public static getInstance(){
        if (!LightManager.instance) {
            // 确保已初始化
            if (!globalBabylon.scene || !globalBabylon.canvas) {
                throw new Error("LightManager 必须在场景初始化后使用！");
            }
            LightManager.instance = new LightManager();
        }
        return LightManager.instance;
    }
    public static reset() {
        if (LightManager.instance) {
            LightManager.instance = null!;
        }
    }
    public setSpotLightIntensity(lightIntensity: number) {
        this.spotLight.intensity = lightIntensity;
    }
    constructor() {
        const scene = globalBabylon.scene!;
        const spotLight = new SpotLight(
            "spotLight",
            new Vector3(-1.673872709274292, 18.254297256469727, -14.205820083618164),
            new Vector3(0.1972587775514061, -0.8802373725453397, 0.4315914070662226),
            10,
            4.14,
            scene);
        // spotLight.intensity = 200;
        spotLight.intensity = 2000;

        spotLight.diffuse = new Color3(0.8156862745098039, 0.6313725490196078, 0.38823529411764707);
        const light = new RectAreaLight("areaLight", new Vector3(0, 4, 0), 2, 2, scene);
        light.diffuse =  new Color3(0.8156862745098039, 0.6313725490196078, 0.38823529411764707);
        light.specular = new Color3(0.8156862745098039, 0.6313725490196078, 0.38823529411764707);
        light.intensity = 3;

        // create skybox, which is indeed an infinite distance box without reflection.
        const skybox = MeshBuilder.CreateBox("skyBox", {size: 150}, scene);
        const skyboxMaterial = new StandardMaterial("skybox", scene);
        skyboxMaterial.diffuseColor = Color3.Black();
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.disableLighting = true;
        skybox.material = skyboxMaterial;
        //set render priority, id 0 means render 1st.
        skybox.renderingGroupId = 0;

        this.shadowGenerator = new ShadowGenerator(1024, spotLight);
        this.shadowGenerator.useBlurExponentialShadowMap = true;
        this.spotLight = spotLight;

    }
}