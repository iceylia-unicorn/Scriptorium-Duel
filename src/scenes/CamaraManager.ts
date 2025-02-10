import {Camera, Scene, UniversalCamera, Vector3} from "@babylonjs/core";

enum VIEWSTATUS {
    // 初始战斗视角
    "default" = 0,
    // 不可转视角的俯视
    "overlook" = 1,
    // 战斗时俯视
    "battleOverlook" = 2,
    // 手牌
    "handCards" = 3,
    // 牌堆
    "deck" = 4,
}

export class CameraManager {
    private battleDefaultCamera: UniversalCamera;
    private overlookCamera: UniversalCamera;
    private _scene: Scene;
    // private disabledKeys: Set<string>;
    private viewStatus: VIEWSTATUS = VIEWSTATUS.default;
    private readonly defaultRotation = new Vector3(0.9265418204398328, -0.002379704337376702, 0);

    constructor(canvas: HTMLCanvasElement | null, scene: Scene) {
        this._scene = scene;
        this.battleDefaultCamera = new UniversalCamera("battleDefaultCamera", new Vector3(-0.7407544520688198, 19.72898229374219, -19.318445146053843), scene);
        this.overlookCamera = new UniversalCamera("overlookCamera", new Vector3(-2.1197295966570405e-16, 30.95540428161621, 3.0498669147491455), this._scene);
        this.battleDefaultCamera.target = new Vector3(-0.7421837071371951, 18.92943459100077, -18.71784432927812);
        this.battleDefaultCamera.rotation = this.defaultRotation;
        this.overlookCamera.target = new Vector3(-0.00110119057385674, 22.91462588299441, 2.961780354354939);
        this.overlookCamera.position = new Vector3(0.001789230271242559, 23.887523651123047, 3.192997932434082);
        this.overlookCamera.rotation.z = Math.PI;

        this.overlookCamera.rotation = new Vector3(1.3962634015954636, 3.141592653589793, 3.141592653589793);// (debugNode as BABYLON.FreeCamera)
        scene.activeCamera = this.battleDefaultCamera;

        // Function to switch cameras
        const switchCamera = (camera: Camera) => {
            scene.activeCamera!.detachControl(canvas);
            scene.activeCamera = camera;
            camera.attachControl(canvas, true);
        };

        // Listen for keyboard events
        window.addEventListener('keydown', (event) => {
            if(this.viewStatus === VIEWSTATUS.overlook) {
                return
            }
            const key = event.key.toLowerCase();
            switch (key) {
                case 'w':
                    if(this.viewStatus === VIEWSTATUS.default){
                        switchCamera(this.overlookCamera);
                        this.viewStatus = VIEWSTATUS.battleOverlook;
                    }
                    else if(this.viewStatus === VIEWSTATUS.handCards){
                        this.rotateCamera(this.battleDefaultCamera, "up");
                        this.viewStatus = VIEWSTATUS.default;
                    }
                    break;
                case 's':
                    if(this.viewStatus === VIEWSTATUS.battleOverlook){
                        switchCamera(this.battleDefaultCamera);
                        this.viewStatus = VIEWSTATUS.default;
                    }
                    else if(this.viewStatus === VIEWSTATUS.default){
                        this.rotateCamera(this.battleDefaultCamera, "down");
                        this.viewStatus = VIEWSTATUS.handCards;
                    }
                    break;
                case 'd':
                    if(this.viewStatus === VIEWSTATUS.default){
                        this.rotateCamera(this.battleDefaultCamera, "right");
                        this.viewStatus = VIEWSTATUS.deck;
                    }
                    else if(this.viewStatus === VIEWSTATUS.handCards){
                        this.rotateCamera(this.battleDefaultCamera, "up");
                        this.rotateCamera(this.battleDefaultCamera, "right");
                        this.viewStatus = VIEWSTATUS.deck;
                    }
                    break;
                case 'a':
                    if(this.viewStatus === VIEWSTATUS.deck){
                        this.rotateCamera(this.battleDefaultCamera, "left");
                        this.viewStatus = VIEWSTATUS.default;
                    }
                    break;
            }
        });

        this.overlookCamera.attachControl(canvas, true);
    }

    private rotateCamera(camera: UniversalCamera, direction: string) {
        switch (direction) {
            case 'down':
                camera.rotation.x += Math.PI / 10; // Rotate down 30 degrees
                break;
            case 'up':
                camera.rotation.x -= Math.PI / 10; // Rotate up 30 degrees
                break;
            case 'right':
                camera.rotation.y += Math.PI / 6; // Rotate right 30 degrees
                camera.rotation.x += Math.PI / 18; // Rotate down 10 degrees

                break;
            case 'left':
                camera.rotation.y -= Math.PI / 6; // Rotate left 30 degrees
                camera.rotation.x -= Math.PI / 18; // Rotate up 10 degrees
                break;
        }
    }
}