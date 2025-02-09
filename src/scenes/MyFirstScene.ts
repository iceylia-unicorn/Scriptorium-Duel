import {
    Camera,
    Color3,
    Engine,
    MeshBuilder,
    Scene, SpotLight,
    StandardMaterial,
    UniversalCamera,
    Vector3
} from "@babylonjs/core";


import {staticUrl} from "../api"
import {Card, StoatCard} from "./Card.ts";
import {CreateDeckMesh1, CreateDeckMesh2, TableManager} from "./DeckManager.ts";
import {ability_strafe, ability_tristrike} from "./Card-database.ts";



const createScene = async (canvas: HTMLCanvasElement | null) => {
    const engine = new Engine(canvas);
    const scene = new Scene(engine);
    // This creates and positions a free camera (non-mesh)
    const battleDefaultCamera = new UniversalCamera("battleDefaultCamera", new Vector3(-0.7407544520688198, 19.72898229374219, -19.318445146053843), scene); //
    const battleFiledCamera = new UniversalCamera("battleFiledCamera", new Vector3(-2.1197295966570405e-16, 30.95540428161621, 3.0498669147491455), scene);

    // battleDefaultCamera.inputs.clear();
    battleFiledCamera.inputs.clear();

    battleDefaultCamera.target = new Vector3(-0.7421837071371951, 18.92943459100077, -18.71784432927812)
    battleDefaultCamera.rotation =new Vector3(0.9265418204398328, -0.002379704337376702, 0);
    battleFiledCamera.target = new Vector3(-0.00110119057385674, 22.91462588299441, 2.961780354354939)
    battleFiledCamera.position = new Vector3(0.001789230271242559, 23.887523651123047, 3.192997932434082);

    battleFiledCamera.rotation = new Vector3(1.3374487740158987, -3.129092434948043, -3.141592561379248);

    scene.activeCamera = battleDefaultCamera;
    // Function to switch cameras
    const switchCamera = function (camera: Camera) {
        scene.activeCamera!.detachControl(canvas);
        scene.activeCamera = camera;
        camera.attachControl(canvas, true);
    };

    // Listen for keyboard events
    window.addEventListener('keydown', function (event) {
        if (event.key === 's' || event.key === 'S') {
            switchCamera(battleDefaultCamera);
        }
        if (event.key === 'w' || event.key === 'W') {
            switchCamera(battleFiledCamera);
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

    // const stoat = new StoatCard(scene, "白鼬", "1", "1", "1");
    const stoat = StoatCard.Create(scene);
    stoat.box.position.x = 5;

    stoat.show();
    // stoat.changeName("长老白鼬");
    // stoat.startTalkAnimate();
    new TableManager(scene);




    // /root/graduation_project/html/static/images/models/table/Poliigon_WoodVeneerOak_7760_BaseColor.jpg

    // stoat.talk("让我来教你吧。通过WS进行切换视角，右键可查看物品功能。");
    const ant = new Card(scene, "bat", "1", "1", "1", staticUrl + "images/cards/portraits/portrait_lice.png",2, [ability_strafe,ability_tristrike]);
    ant.box.position = new Vector3(1.8832770407085523e-16, -4.578444004058838, 1.407560110092163);// (debugNode as BABYLON.Mesh)
    ant.box.rotation  = new Vector3(1.1502502007897775, 3.141592653589793, 3.141592653589793);// (debugNode as BABYLON.Mesh)
    // const ant2 = new Card(scene, "bat", "1", "1", "1", staticUrl + "images/cards/portraits/portrait_lice.png");
    ant.hide();
    ant.show();
    // const gl = new GlowLayer("glowMesh", scene);
    // gl.intensity = 0.5;
    ability_tristrike.addFun(ant);

    ability_tristrike.addFun(ant);

    const ant2 = new Card(scene, "bat", "1", "1", "1", staticUrl + "images/cards/portraits/portrait_lice.png",2, [ability_strafe,ability_tristrike]);
    const ant3 = new Card(scene, "bat", "1", "1", "1", staticUrl + "images/cards/portraits/portrait_lice.png",2, [ability_strafe,ability_tristrike]);

    const deckManager1 = CreateDeckMesh1(scene);

    const squirrelDeckManager = CreateDeckMesh2(scene);

    deckManager1.initDeck([ant, stoat,ant2, ant3]);
    // deckManager1.updateDeck(20);
    squirrelDeckManager.initSquirrelDeck(15);


    // const bat = new Card(scene, "bat", "1", "1", "1", staticUrl + "images/cards/portraits/portrait_bat.png");
    if (import.meta.env.MODE === 'development') {
        await import('@babylonjs/inspector');
        await scene.debugLayer.show();
    }

    engine.runRenderLoop(() => {
        scene.render();
    });

}
export {createScene}