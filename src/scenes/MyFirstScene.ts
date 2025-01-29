import {
    Camera,
    Color3,
    DynamicTexture, Engine,
    type ICanvasRenderingContext,
    MeshBuilder, PBRMaterial,
    Scene, SpotLight,
    StandardMaterial,
    Texture, UniversalCamera,
    Vector3
} from "@babylonjs/core";


import {staticUrl} from "../api"
import {ability_strafe, ability_tristrike, Card} from "./sigils.ts";


class StoatCard extends Card {
    private talkAnimationFrameId:number|null = null;
    private isTalkAnimating = false;
    // 用来切换嘴巴状态的变量
    private mouthState = "closed"; // "open" 或 "closed"
    private eyeState = "open";
    private lastTime = 0;
    private stoat_body_context: ICanvasRenderingContext;
    private readonly stoat_body_texture: DynamicTexture;
    private readonly stoat_mouth_img;
    private readonly stoat_eyes_img;
    private readonly stoat_eyes_closed_img;
    private readonly stoat_mouth_open_img;


    constructor(scene: Scene, name: string, attack: string, HP: string, cost: string) {
        super(scene, name, attack, HP, cost);
        let cardWidth = 4, cardHeight = 6;
        // stoat
        let stoat_body = MeshBuilder.CreatePlane("stoat_body", {height: cardHeight, width: cardWidth});
        stoat_body.parent = this.box;
        stoat_body.position = new Vector3(6.9624457359313965, -2.2657313346862793, -0.050999999046325684);
        stoat_body.scaling = new Vector3(4.160670280456543, 1.458072543144226, 1);


        this.stoat_body_texture = new DynamicTexture("stoat_body_texture", {width: 512, height: 256});

        this.stoat_body_context = this.stoat_body_texture.getContext();


        let stoat_body_mat = new StandardMaterial("stoat_body_mat");

        stoat_body_mat.diffuseTexture = this.stoat_body_texture;
        stoat_body_mat.diffuseTexture.hasAlpha = true;

        let stoat_body_img = new Image();
        this.stoat_mouth_img = new Image();
        this.stoat_eyes_img = new Image();
        this.stoat_eyes_closed_img = new Image();
        this.stoat_mouth_open_img = new Image();

        // img cros
        this.stoat_eyes_img.crossOrigin = "Anonymous";
        this.stoat_mouth_img.crossOrigin = "Anonymous";
        stoat_body_img.crossOrigin = "Anonymous";
        this.stoat_mouth_open_img.crossOrigin = "Anonymous";
        this.stoat_eyes_closed_img.crossOrigin = "Anonymous"

        this.stoat_eyes_img.src = staticUrl + "images/cards/portraits/talkingCards/stoat_character_eyes_opened.png";
        stoat_body_img.src = staticUrl + "images/cards/portraits/talkingCards/stoat_character_body.png"
        this.stoat_mouth_img.src = staticUrl + "images/cards/portraits/talkingCards/stoat_character_mounth_opened.png"
        this.stoat_mouth_open_img.src = staticUrl + "images/cards/portraits/talkingCards/stoat_character_mounth_closed.png";
        this.stoat_eyes_closed_img.src = staticUrl + "images/cards/portraits/talkingCards/stoat_character_eyes_closed.png";


        stoat_body.material = stoat_body_mat;


        // 图片加载完成后的处理
        let imagesLoaded = 0;
        let totalImages = 4;

        let checkAllImagesLoaded = () => {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
                // 确保所有图片加载完成后开始绘制
                // 先绘制主体和眼睛
                this.stoat_body_context.drawImage(stoat_body_img, 0, 0);
                this.stoat_body_context.drawImage(this.stoat_eyes_img, 18, 28);

                // mouth closed
                this.stoat_body_context.drawImage(this.stoat_mouth_img, 20, 40);
                this.stoat_body_texture.update();
            }
        }

        stoat_body_img.onload = checkAllImagesLoaded;
        this.stoat_eyes_img.onload = checkAllImagesLoaded;
        this.stoat_mouth_img.onload = checkAllImagesLoaded;
        this.stoat_mouth_open_img.onload = checkAllImagesLoaded;
    }

    public talk(text: string): void {
        this.startTalkAnimate();
        let currentText = "";
        let index = 0;

        const punctuationRegex = /[，。！？；：,.]/;//判断是否是标点的正则
        const intervalId = setInterval(() => {
            if (index < text.length) {
                const currentChar = text.charAt(index);
                if (!punctuationRegex.test(currentChar)) {//遇到标点停顿，非标点前进
                    currentText += text.charAt(index);
                    this.cardNameTexture.clear();
                    this.cardNameTexture.drawText(currentText, null, null, "bold 50px monospace", "black", "transparent", true, true);
                } else {
                    currentText = "";
                }
                index++;
            } else {
                clearInterval(intervalId);
                this.setName(this.getName());
                this.stopTalkAnimate();
            }
        }, 400)
        // this.stopTalkAnimate();
    }

    private talkAnimate = (() => {
        if (!this.isTalkAnimating) return;
        let currentTime = performance.now();
        if (currentTime - this.lastTime > 500) { // 每500ms更新一次
            // 清除嘴巴区域
            this.stoat_body_context.clearRect(24, 28, 47, 34);
            this.stoat_body_context.clearRect(30, 45, 32, 20);
            if (this.mouthState === "open") {
                this.stoat_body_context.drawImage(this.stoat_mouth_img, 20, 40); // 绘制闭嘴的图片
                this.mouthState = "closed";  // 切换状态为闭嘴
            } else {
                this.stoat_body_context.drawImage(this.stoat_mouth_open_img, 20, 40); // 绘制张嘴的图片
                this.mouthState = "open";  // 切换状态为张嘴
            }
            if (this.eyeState === "open") {
                this.stoat_body_context.drawImage(this.stoat_eyes_img, 18, 28);
            } else {
                this.stoat_body_context.drawImage(this.stoat_eyes_closed_img, 18, 28);

            }
            this.lastTime = currentTime;
            this.stoat_body_texture.update();
        }
        if (currentTime - this.lastTime > 300) {
            this.stoat_body_context.clearRect(24, 28, 47, 34);
            this.stoat_body_context.clearRect(30, 45, 32, 20);
            if (this.eyeState === "open") {
                this.stoat_body_context.drawImage(this.stoat_eyes_closed_img, 18, 28);
                this.eyeState = "closed";
            } else {
                this.stoat_body_context.drawImage(this.stoat_eyes_img, 18, 28);
                this.eyeState = "open";
            }
            if (this.mouthState === "open") {
                this.stoat_body_context.drawImage(this.stoat_mouth_open_img, 20, 40); // 绘制张嘴的图片
            } else {
                this.stoat_body_context.drawImage(this.stoat_mouth_img, 20, 40); // 绘制闭嘴的图片
            }
            this.stoat_body_context.drawImage(this.stoat_eyes_img, 18, 28);
        }
        if (this.isTalkAnimating) {
            this.talkAnimationFrameId = requestAnimationFrame(this.talkAnimate);
        }

    }) as FrameRequestCallback;

    public startTalkAnimate() {
        if (this.isTalkAnimating) return;
        this.isTalkAnimating = true;
        this.talkAnimationFrameId = requestAnimationFrame(this.talkAnimate);
    }

    public stopTalkAnimate() {

        if (!this.isTalkAnimating) return; // 如果动画没有在播放，直接返回
        this.isTalkAnimating = false;
        if (this.talkAnimationFrameId !== null) {
            cancelAnimationFrame(this.talkAnimationFrameId); // 停止当前的动画帧
            this.talkAnimationFrameId = null;
        }
        // 更新状态为闭嘴
        this.stoat_body_context.clearRect(24, 28, 47, 34);
        this.stoat_body_context.clearRect(30, 45, 32, 20);
        this.stoat_body_context.drawImage(this.stoat_mouth_img, 20, 40); // 绘制闭嘴的图片
        this.stoat_body_context.drawImage(this.stoat_eyes_img, 18, 28);
        this.eyeState = "open";
        this.mouthState = "closed";  // 切换状态为闭嘴
        this.stoat_body_texture.update();
    }
}

const createScene = async (canvas: HTMLCanvasElement | null) => {
    const engine = new Engine(canvas);
    const scene = new Scene(engine);
    // This creates and positions a free camera (non-mesh)
    const battleDefaultCamera = new UniversalCamera("battleDefaultCamera", new Vector3(-0.7407544520688198, 19.72898229374219, -19.318445146053843), scene); //
    const replacedCamera = new UniversalCamera("battleDefaultCamera", new Vector3(-2.1197295966570405e-16, 30.95540428161621, 3.0498669147491455), scene);
    // battleDefaultCamera.inputs.clear();


    // replacedCamera.inputs.clear();
    battleDefaultCamera.target = new Vector3(-0.731189471204295, 18.946959102290165, -18.695269226997905)
    replacedCamera.target = new Vector3(-2.018536274440631e-16, 29.958824038505554, 2.9672362953424454)
    replacedCamera.rotation = new Vector3(1.550545999999994, 6.295685487522346, 0)

    scene.activeCamera = battleDefaultCamera;
    // Function to switch cameras
    const switchCamera = function (camera: Camera) {
        scene.activeCamera!.detachControl(canvas);
        scene.activeCamera = camera;
        camera.attachControl(canvas, true);
    };

    // Listen for keyboard events
    window.addEventListener('keydown', function (event) {
        if (event.key === 'w' || event.key === 'W') {
            switchCamera(battleDefaultCamera);
        }
        if (event.key === 's' || event.key === 'S') {
            switchCamera(replacedCamera);
        }
    });
    // This targets the camera to scene origin
    // battleDefaultCamera.setTarget(Vector3.Zero());
    // battleDefaultCamera.inputs.addMouseWheel();

    // This attaches the camera to the canvas
    battleDefaultCamera.attachControl(canvas, true);


    const spotLight = new SpotLight(
        "spotLight",
        new Vector3(-1.673872709274292, 18.254297256469727, -14.205820083618164),
        new Vector3(0.1972587775514061, -0.8802373725453397, 0.4315914070662226),
        10,
        4.14,
        scene);
    // spotLight.exponent = 4.14;
    spotLight.intensity = 100;
    // spotLight.direction = new Vector3(0.1972587775514061, -0.8802373725453397, 0.4315914070662226);
    // spotLight.position = new Vector3(-1.673872709274292, 18.254297256469727, -14.205820083618164)
    spotLight.diffuse = new Color3(0.8156862745098039, 0.6313725490196078, 0.38823529411764707);
    // create skybox, which is indeed a infinite distance box without reflection.
    const skybox = MeshBuilder.CreateBox("skyBox", {size:150}, scene);
    const skyboxMaterial = new StandardMaterial("skybox", scene);
    skyboxMaterial.diffuseColor = Color3.Black();
    // skyboxMaterial.specularColor = Color3.White();
    skyboxMaterial.backFaceCulling = false;
    // skybox.infiniteDistance = true;
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;
    //set render priority, id 0 means render 1st.
    skybox.renderingGroupId = 0;


    // This creates and positions a free camera (non-mesh)


    const stoat = new StoatCard(scene, "白鼬", "1", "1", "1");
    stoat.box.position.x = 5;
    // stoat.changeName("长老白鼬");
    // stoat.startTalkAnimate();

    const table = MeshBuilder.CreateBox("table", {
        width: 40,
        height: 40,
    })
    // const tableMaterial = new StandardMaterial("tableMaterial", scene);
    const pbrMaterial = new PBRMaterial("pbrTableMaterial", scene);
    pbrMaterial.albedoTexture = new Texture(staticUrl + "images/models/table/Poliigon_WoodVeneerOak_7760_BaseColor.jpg", scene); // 漫反射纹理
    pbrMaterial.metallicTexture = new Texture(staticUrl + "images/models/table/Poliigon_WoodVeneerOak_7760_Metallic.jpg")
    table.material = pbrMaterial;
    table.position = new Vector3(1.540871118621494e-16, -4.0289435386657715, -1.2582167387008667);// (debugNode as BABYLON.Mesh)
    table.rotation = new Vector3(1.1649784981529603, 3.141592653589793, 3.141592653589793);// (debugNode as BABYLON.Mesh)
    // /root/graduation_project/html/static/images/models/table/Poliigon_WoodVeneerOak_7760_BaseColor.jpg

    // stoat.talk("让我来教你吧。通过WS进行切换视角，右键可查看物品功能。");
    const ant = new Card(scene, "bat", "1", "1", "1", staticUrl + "images/cards/portraits/portrait_lice.png",2, [ability_strafe,ability_tristrike]);
    ant.box.position = new Vector3(1.8832770407085523e-16, -4.578444004058838, 1.407560110092163);// (debugNode as BABYLON.Mesh)
    ant.box.rotation  = new Vector3(1.1502502007897775, 3.141592653589793, 3.141592653589793);// (debugNode as BABYLON.Mesh)
    // const ant2 = new Card(scene, "bat", "1", "1", "1", staticUrl + "images/cards/portraits/portrait_lice.png");

    // const gl = new GlowLayer("glowMesh", scene);
    // gl.intensity = 0.5;
    ability_tristrike.addFun(ant);

    ability_tristrike.addFun(ant);



    // const bat = new Card(scene, "bat", "1", "1", "1", staticUrl + "images/cards/portraits/portrait_bat.png");
    if (import.meta.env.MODE === 'development') {
        await import('@babylonjs/inspector');
        scene.debugLayer.show();
    }
    engine.runRenderLoop(() => {
        scene.render();
    });

}
export {createScene}