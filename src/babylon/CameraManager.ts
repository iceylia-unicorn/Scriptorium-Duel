import {Camera, Scene, UniversalCamera, Vector3} from "@babylonjs/core";
import {DeckManager} from "./DeckManager.ts";
import { globalBabylon } from "./globals";
export enum VIEWSTATUS {
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
    //**神秘石**/
    "mysteriousStone" = 5
}

export class CameraManager {
    private static instance: CameraManager; // 启用单例模式。
    public battleDefaultCamera: UniversalCamera;
    private overlookCamera: UniversalCamera;
    private _scene: Scene;
    private _canvas: HTMLCanvasElement;
    // private disabledKeys: Set<string>;
    private keyHandler: (event: any) => void;
    private viewStatus: VIEWSTATUS = VIEWSTATUS.default;
    private readonly defaultTarget = new Vector3(-0.7421837071371951, 18.92943459100077, -18.71784432927812);
    // 状态锁定
    private statusLock = false;
    public unlockOverlook() {
        this.viewStatus = VIEWSTATUS.battleOverlook;
    }
    public switchToBattleOverlook() {
        this.switchCamera(this.overlookCamera);
        this.viewStatus = VIEWSTATUS.battleOverlook;
        this.battleDefaultCamera.target = this.defaultTarget;
    }
    public switchViewStatus(status: VIEWSTATUS) {
        this.initCamera();
        this.viewStatus = VIEWSTATUS.default;
        switch (status) {
            case VIEWSTATUS.overlook:
                this.switchCamera(this.overlookCamera);
                // this.viewStatus = VIEWSTATUS.overlook;
                break;
            case VIEWSTATUS.battleOverlook:
                this._event_w();
                break;
            case VIEWSTATUS.handCards:
                this._event_s();
                break;
            case VIEWSTATUS.deck:
                this._event_d();
                break;
            case VIEWSTATUS.mysteriousStone:
                // this.statusLock = true;
                CameraManager.getInstance().battleDefaultCamera.target = new Vector3(0.30691455196760886, -4.971132163527603, -3.4919508084319784);
                CameraManager.getInstance().battleDefaultCamera.position = new Vector3(0, 15, -7);
                CameraManager.getInstance().battleDefaultCamera.rotation = new Vector3(1.3962634015954636, 0.08726646259971647, 0.10471975511965977);

                break;
            case VIEWSTATUS.default:
                this.switchCamera(this.battleDefaultCamera);
                this.statusLock = false;

                break;

        }
    }
    private _event_w(){
        if(this.viewStatus === VIEWSTATUS.default){
            this.switchCamera(this.overlookCamera);
            this.viewStatus = VIEWSTATUS.battleOverlook;
        }
        else if(this.viewStatus === VIEWSTATUS.handCards){
            this.rotateCamera(this.battleDefaultCamera, "up");
            this.viewStatus = VIEWSTATUS.default;
        }
    }
    private _event_s(){
        if(this.viewStatus === VIEWSTATUS.battleOverlook){
            this.switchCamera(this.battleDefaultCamera);
            this.viewStatus = VIEWSTATUS.default;
        }
        else if(this.viewStatus === VIEWSTATUS.default){
            this.rotateCamera(this.battleDefaultCamera, "down");
            this.viewStatus = VIEWSTATUS.handCards;
        }
    }
    private _event_d(){
        if(this.viewStatus === VIEWSTATUS.default){
            this.rotateCamera(this.battleDefaultCamera, "right");
            this.viewStatus = VIEWSTATUS.deck;
        }
        else if(this.viewStatus === VIEWSTATUS.handCards){
            this.rotateCamera(this.battleDefaultCamera, "up");
            this.rotateCamera(this.battleDefaultCamera, "right");
            this.viewStatus = VIEWSTATUS.deck;
        }
    }
    private _event_a(){
        if(this.viewStatus === VIEWSTATUS.deck){
            this.rotateCamera(this.battleDefaultCamera, "left");
            this.viewStatus = VIEWSTATUS.default;
        }
    }
    //初始化位置和旋转。
    private initCamera(){
        this.battleDefaultCamera.target = this.defaultTarget;
        this.battleDefaultCamera.rotation = new Vector3(0.9265418204398328, -0.002379704337376702, 0);
        this.overlookCamera.target = new Vector3(-0.00110119057385674, 22.91462588299441, 2.961780354354939);
        this.overlookCamera.position = new Vector3(0.001789230271242559, 23.887523651123047, 3.192997932434082);
        // this.overlookCamera.rotation.z = Math.PI;
        this.overlookCamera.rotation = new Vector3(1.3962634015954636, 3.141592653589793, 3.141592653589793);// (debugNode as BABYLON.FreeCamera)
    }
    public static getInstance(): CameraManager {
        if (!CameraManager.instance) {
            // 确保已初始化
            if (!globalBabylon.scene || !globalBabylon.canvas) {
                throw new Error("CameraManager 必须在场景初始化后使用！");
            }
            CameraManager.instance = new CameraManager();
        }
        return CameraManager.instance;
    }
    private constructor(scene?: Scene, canvas?: HTMLCanvasElement) {
        this._scene = scene || globalBabylon.scene!;
        this._canvas = canvas || globalBabylon.canvas!;

        this.battleDefaultCamera = new UniversalCamera("battleDefaultCamera", new Vector3(-0.7407544520688198, 19.72898229374219, -19.318445146053843), this._scene);
        this.overlookCamera = new UniversalCamera("overlookCamera", new Vector3(-2.1197295966570405e-16, 30.95540428161621, 3.0498669147491455), this._scene);
        this.initCamera();
        this._scene.activeCamera = this.battleDefaultCamera;

        this.keyHandler = (event:any) => {
            if (document.activeElement !== this._canvas) {
                return;
            }
            if(this.viewStatus === VIEWSTATUS.overlook || this.statusLock) {
                return
            }
            const key = event.key.toLowerCase();
            // 当处于卡牌放置时，按esc退出。
            if (key === 'escape' || key === "s") {
                if (DeckManager.currentCard && this.viewStatus === VIEWSTATUS.battleOverlook && DeckManager.currentSacrificeCount === 0) {
                    DeckManager.cancelPlacementOnClawMarks();
                    this.switchCamera(this.battleDefaultCamera);
                    this.viewStatus = VIEWSTATUS.default;
                    return;

                }
            }
            switch (key) {
                case 'f':
                    this.switchCamera(this.battleDefaultCamera);
                    this.battleDefaultCamera.attachControl(this._scene);
                    break;
                case 'w':
                    this._event_w();
                    break;
                case 's':
                    this._event_s();
                    break;
                case 'd':
                   this._event_d();
                    break;
                case 'a':
                    this._event_a();
                    break;
            }
        };
        window.addEventListener('keydown', this.keyHandler);

    }
    // Function to switch cameras
    private switchCamera(camera: Camera){
        this._scene.activeCamera?.detachControl(this._canvas);
        this._scene.activeCamera = camera;
    };
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
    // 重置实例
    public static reset() {
        if (CameraManager.instance) {
            // 移除事件监听器
            window.removeEventListener('keydown', CameraManager.instance.keyHandler);
            CameraManager.instance = null!;
        }
    }
}