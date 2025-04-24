import {staticUrl} from "../api";
import {v4 as uuid} from 'uuid';
import {
    Animation,
    Color3,
    DynamicTexture,
    type ICanvasRenderingContext,
    Mesh,
    MeshBuilder,
    Scene,
    StandardMaterial,
    Texture,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {loadImage, PRESET_CARDS} from "./Card-database.ts";
import {type CardCost, CardTribe, type Sigil} from "./Card-types.ts";
import {DeckManager} from "./DeckManager.ts";

// 初始印记对应的位置。
const addedPosition = [[-1.23, 1.6], [-1.23, 0.3]];
const sigilWidth = 1.38;
let cardWidth = 4, cardHeight = 6, cardDeep = 0.05; // card size


export class Card {
    private readonly box: Mesh;
    private cardName: Mesh;
    private cardAttack: Mesh;
    private cardHP: Mesh;
    //id uuid
    readonly #id:string;
    //种族
    readonly #tribe:string;
    // cardCost: Mesh;
    //最前面的模板，触发点击事件
    topMask = MeshBuilder.CreatePlane("cardMask", {
        width: cardWidth,
        height: cardHeight
    });
    public maskImageData: any;
    // public placedIndex: number = -1;
    //**进化后的卡牌名字*/
    public evolvedCard: string;
    readonly #presetKey: string;
    //**是否为衍生牌*/
    readonly #isSpawned: boolean;
    get presetKey(): string {
        return this.#presetKey;
    }
    get id(){
        return this.#id;
    }
    get tribe(){
        return this.#tribe
    }
    //**是否为衍生牌*/
    get isSpawned(){
        return this.#isSpawned;
    }
    rootNode: TransformNode;
    static zIndex1 = -0.051;
    static zIndex2 = -0.052;
    static topZindex = -0.053;


    private nameValue: string;
    #attack: string;
    private readonly _attack:string;
    #hp:string;
    private readonly _hp:string;
    #cost: string;

    cardNameTexture: DynamicTexture;
    cardHPTexture: DynamicTexture;
    cardAttackTexture: DynamicTexture;
    maskTexture: DynamicTexture;


    initSigilNum = 0; //初始印记数量
    curSigilNum = 0; //当前印记数量
    sigilsArr: Set<Sigil> = new Set<Sigil>() ;//印记数组。
    public playedFuns: Array<Function> | Array<null> = []; //被放置时的回调函数
    strikeFuns: Array<Function> = []; //攻击时的回调函数
    beAttackedFuns = []; // 被攻击时的回调函数
    onSacrificeFuns = [()=>{
        this.hide();
        DeckManager.currentSacrificeCount++;
        DeckManager.placedCards.forEach((item,index)=>{
            if(index< 4 && item){
                if(item.id == this.id){
                    DeckManager.placedCards[index] = null;
                }
            }

        })
    }]; //献祭后的回调
    onTurnOverFuns:Array<Function> = []
    /**已放置的回合数，第一次召唤不能攻击*/
    placedTurnCount = 0;

    isVisible: boolean;//是否可见。
    public setName(value: string) {
        this.nameValue = value;
        this.cardNameTexture.clear();
        this.cardNameTexture.drawText(this.nameValue, null, null, "bold 90px monospace", "gray", "transparent", true, true);//assign null to position cause center position.
    }
    public getName() {
        return this.nameValue;
    }
    set hp(value: number) {
        this.#hp = value.toString();
        this.cardHPTexture.clear();
        this.cardHPTexture.drawText(this.#hp, null, null, "bold 300px monospace", "black", "transparent", true, true);//assign null to positon cause center position.
    }
    get hp(){
        return parseInt(this.#hp);
    }
    get cost(): number {
        return parseInt(this.#cost);
    }
    set cost(value: number) {
        this.#cost = value.toString();
    }
    get attack():number {
        return parseInt(this.#attack);
    }
    set attack(value:number) {
        this.#attack = value.toString();
        this.cardAttackTexture.clear();
        this.cardHPTexture.drawText(this.#attack, null, null, "bold 300px monospace", "black", "transparent", true, true);//assign null to positon cause center position.
    }
    //将属性重置
    public resetAttribute(){
        this.#attack = this._attack;
        this.#hp = this._hp;
        this.placedTurnCount = 0;
        // this.cost = this._cost
    }
    // 修改后的Card类show方法
    public show(
        parent?: Mesh | TransformNode,
        position?: Vector3,
        rotation?: Vector3,
        animationOptions?: {
            fromPosition?: Vector3;
            duration?: number;
        }
    ): void {
        // 基础位置设置
        const targetPosition = position || Vector3.Zero();
        const startPosition = animationOptions?.fromPosition || targetPosition;

        // 直接设置初始位置
        this.rootNode.position = startPosition.clone();

        if (parent) this.rootNode.parent = parent;
        if (rotation) this.rootNode.rotation = rotation;

        // 动画参数
        const duration = animationOptions?.duration ?? 30; // 默认30帧

        // 当需要动画时
        if (animationOptions?.fromPosition) {
            Animation.CreateAndStartAnimation(
                "cardAppear",
                this.rootNode,
                "position",
                60, // fps
                duration,
                startPosition,
                targetPosition,
                Animation.ANIMATIONLOOPMODE_CONSTANT,
                undefined,
                () => {
                    // 动画结束后确保最终位置准确
                    this.rootNode.position = targetPosition;
                }
            );
        }

        // 原有可见性逻辑
        if (this.isVisible) return;
        this.rootNode.setEnabled(true);
        this.isVisible = true;
    }
    public hide(): void {
        if (!this.isVisible) return;
        this.rootNode.setEnabled(false);
        // this.box.getDescendants().forEach(child => child.setEnabled(false));
        this.isVisible = false;
    }

    static hideAll(cards: Card[]): void {
        cards.forEach(card => {
            card.hide();
        })
    }

    constructor(scene: Scene,presetKey:string, name: string, attack: string, HP: string, cost: CardCost,tribe:string, portraitUrl = "", sigilsArr: Array<Sigil> | null = null,evolvedCard = "", isSpawned=false, id:string = "root") {
        this.nameValue = name;
        this.#attack = attack;
        this._attack = attack;
        this.#hp = HP;
        this._hp = HP;
        this.#cost = cost;
        this.#isSpawned = isSpawned;
        // this._cost = cost;
        this.isVisible = true;
        if(id === "root") id = uuid();
        this.#id = id;
        this.#tribe = tribe;
        this.evolvedCard = evolvedCard;
        this.#presetKey = presetKey;

        //Create base card mesh
        // let a = MeshBuilder.CreatePlane()
        this.box = MeshBuilder.CreateBox(name, {
            width: cardWidth,  // 宽度
            height: cardHeight,  // 高度
            depth: cardDeep  // 深度
        }, scene);

        // Card components mesh
        this.cardName = MeshBuilder.CreatePlane("cardName", {
            width: cardWidth,
            height: cardHeight / 5
        }, scene);
        this.cardAttack = MeshBuilder.CreatePlane("cardAttack", {
            width: cardWidth,
            height: cardHeight / 5
        }, scene);
        this.cardHP = MeshBuilder.CreatePlane("cardHP", {
            width: cardWidth,
            height: cardHeight / 5
        }, scene);
        this.rootNode = new TransformNode(name +"-" + id, scene, false);
        this.topMask.parent = this.rootNode;

        // Card components position
        this.cardName.parent = this.box;
        this.cardAttack.parent = this.box;
        this.cardHP.parent = this.box;
        this.box.parent = this.rootNode;



        this.cardName.position.z = -cardDeep / 2 - 0.001;
        this.cardAttack.position.z = -cardDeep / 2 - 0.001;
        this.cardHP.position.z = -cardDeep / 2 - 0.001;
        this.topMask.position.z = Card.topZindex;

        this.cardName.position.y = 2.4;

        this.cardAttack.position = new Vector3(-1.4123108768463135, -1.7970725297927856, Card.zIndex1);// (debugNode as BABYLON.Mesh)
        this.cardAttack.scaling = new Vector3(0.38578611612319946, 0.7965781688690186, 0.9886031150817871);// (debugNode as BABYLON.Mesh)

        this.cardHP.scaling = new Vector3(0.38578611612319946, 0.7965781688690186, 0.9886031150817871);// (debugNode as BABYLON.Mesh)
        this.cardHP.position = new Vector3(1.4026998472213745, -2.1753363609313965, Card.zIndex1);// (debugNode as BABYLON.Mesh)

        //Create base_card_mat and assign it to mesh
        let baseCardMat = new StandardMaterial("baseCardMat");
        baseCardMat.specularColor = Color3.Black(); // 完全禁用高光反射
        baseCardMat.diffuseTexture = new Texture(staticUrl + "images/cards/base card/card_empty_sprite.png");
        this.box.material = baseCardMat;

        // Create components dynamic texture
        this.cardNameTexture = new DynamicTexture("cardNameTexture", {width: 512, height: 256});
        this.cardAttackTexture = new DynamicTexture("cardAttackTexture", {width: 512, height: 256});
        this.cardHPTexture = new DynamicTexture("cardHPTexture", {width: 512, height: 256});
        if (cost != "0") {
            const cardCost = MeshBuilder.CreatePlane("cardCost", {
                width: cardWidth / 2.4,
                height: cardWidth / 2.4
            }, scene);
            cardCost.parent = this.box;
            cardCost.position = new Vector3(1.0254558324813843, 1.5573967695236206, Card.zIndex2);// (debugNode as BABYLON.Mesh)

            let cardCostTexture;

            switch (cost) {
                case '1':
                    cardCostTexture = new Texture(staticUrl + "images/cards/cost/cost_1blood.png");
                    break;
                case '2':
                    cardCostTexture = new Texture(staticUrl + "images/cards/cost/cost_2blood.png");
                    break;
                case '3':
                    cardCostTexture = new Texture(staticUrl + "images/cards/cost/cost_3blood.png");
                    break;
                case '4':
                    cardCostTexture = new Texture(staticUrl + "images/cards/cost/cost_4blood.png");
                    break;
            }
            let cardCostMat = new StandardMaterial("cardCostMat");
            cardCostMat.diffuseTexture = cardCostTexture;
            cardCostMat.diffuseTexture.hasAlpha = true;
            cardCostMat.specularColor = Color3.Black();
            cardCost.material = cardCostMat;
        }

        this.maskTexture = new DynamicTexture("maskTexture", {width: 400, height: 600});

        //Create components material
        let cardNameMat = new StandardMaterial("cardNameMat");
        let cardAttackMat = new StandardMaterial("cardAttackMat");
        let cardHPMat = new StandardMaterial("cardHPMat");
        let cardMaskMat = new StandardMaterial("cardMaskMat");

        cardNameMat.diffuseTexture = this.cardNameTexture;
        cardAttackMat.diffuseTexture = this.cardAttackTexture;
        cardHPMat.diffuseTexture = this.cardHPTexture;
        cardMaskMat.diffuseTexture = this.maskTexture;


        cardNameMat.specularColor = Color3.Black();
        cardAttackMat.specularColor = Color3.Black();
        cardHPMat.specularColor = Color3.Black();
        cardMaskMat.specularColor = Color3.Black();


        //draw text of texture
        cardNameMat.diffuseTexture.hasAlpha = true;  // Enable alpha transparency for the texture
        cardAttackMat.diffuseTexture.hasAlpha = true;
        cardHPMat.diffuseTexture.hasAlpha = true;
        cardMaskMat.diffuseTexture.hasAlpha = true;


        this.cardNameTexture.drawText(this.nameValue, null, null, "bold 90px monospace", "gray", "transparent", true, true);
        this.cardAttackTexture.drawText(this.#attack, null, null, "bold 300px monospace", "black", "transparent", true, true);
        this.cardHPTexture.drawText(this.#hp, null, null, "bold 300px monospace", "black", "transparent", true, true);

        this.cardName.material = cardNameMat;
        this.cardAttack.material = cardAttackMat;
        this.cardHP.material = cardHPMat;
        this.topMask.material = cardMaskMat;


        // 设置立绘
        if (portraitUrl != "") {
            let cardPortrait = MeshBuilder.CreatePlane("cardPortrait", {
                width: cardWidth,
                height: cardWidth
            }, scene);
            cardPortrait.parent = this.box;
            cardPortrait.position.z = -cardDeep / 2 - 0.001;
            let cardPortraitMat = new StandardMaterial("cardPortraitMat");
            let cardPortraitTexture = new DynamicTexture("cardPortraitTexture", {width: 128, height: 128});

            cardPortraitMat.diffuseTexture = cardPortraitTexture;
            cardPortraitMat.diffuseTexture.hasAlpha = true;
            cardPortraitMat.useAlphaFromDiffuseTexture = true;
            cardPortraitMat.specularColor = Color3.Black();
            // portraitUrl
            let portraitImg = new Image();
            portraitImg.crossOrigin = "anonymous";
            portraitImg.src = portraitUrl;

            portraitImg.onload = () => {
                // 获取图像的实际尺寸
                const imgWidth = portraitImg.width;
                const imgHeight = portraitImg.height;

                // 计算居中位置
                const xOffset = (128 - imgWidth) / 2;
                const yOffset = (128 - imgHeight) / 2;

                // 获取 DynamicTexture 上下文
                const ctx = cardPortraitTexture.getContext();// 将图片绘制到纹理中心
                ctx.drawImage(portraitImg, xOffset, yOffset, imgWidth, imgHeight);

                // 更新纹理
                cardPortraitTexture.update();
            }
            cardPortrait.material = cardPortraitMat;
            cardPortrait.position = new Vector3(0.03692801669239998, 0.4918590188026428, Card.zIndex1);// (debugNode as BABYLON.Mesh)
            // cardPortrait.position = new Vector3(0.22600166499614716, -0.018258297815918922, -0.050999999046325684);// (debugNode as BABYLON.Mesh)
        }
        this.initSigilNum = sigilsArr ? sigilsArr.length : 0;

        if (sigilsArr) {
            sigilsArr.forEach((sig: Sigil, index) => {
                this.curSigilNum = index;
                sig.addFun(this);
            })
        }

        this.hide();
    }

    // 绘制印记
    async drawSigil(src: string) {
        let sigilMesh = MeshBuilder.CreatePlane("sigilMesh", {
            width: sigilWidth,
            height: sigilWidth
        })

        sigilMesh.parent = this.box;
        sigilMesh.position.y = -1.9;
        sigilMesh.position.z = Card.zIndex2;

        let sigilMat = new StandardMaterial("sigilMat");
        sigilMat.useAlphaFromDiffuseTexture = true;
        let sigilTexture = new DynamicTexture("sigilTexture", {width: 50, height: 50});
        sigilTexture.hasAlpha = true;
        sigilMat.diffuseTexture = sigilTexture;
        sigilMat.specularColor = Color3.Black();
        sigilMat.backFaceCulling = false;
        sigilMesh.material = sigilMat;

        let curSigilNum = this.curSigilNum++;

        const sigil = await loadImage(src) as HTMLImageElement;
        const ctx = sigilTexture.getContext();
        //当前印记小于初始印记，上的是初始印记
        if (curSigilNum < this.initSigilNum) {
            if (this.initSigilNum === 2) {//有两个印记时
                if (curSigilNum === 0) {//第一个印记位置
                    sigilMesh.position = new Vector3(-0.46413654088974, -2.2142415046691895, Card.zIndex2);// (debugNode as BABYLON.Mesh)
                } else {//第二个印记位置
                    sigilMesh.position = new Vector3(0.524353563785553, -1.6424427032470703, Card.zIndex2);// (debugNode as BABYLON.Mesh)
                }
            }

        } else {

            if (this.initSigilNum !== 0) {
                const index = curSigilNum - this.initSigilNum;
                sigilMesh.position = new Vector3(addedPosition[index][0], addedPosition[index][1], Card.zIndex2);// (debugNode as BABYLON.Mesh)
            }
            sigilMat.diffuseColor = Color3.White();
        }
        // ctx.drawImage(sigil, (50 - 35) /2, (50 - 35) /2, 35, 35);
        ctx.drawImage(sigil, 7.5, 7.5, 35, 35);

        if (curSigilNum >= this.initSigilNum) {
            const offscreenCanvas = document.createElement('canvas') as HTMLCanvasElement;
            offscreenCanvas.width = sigil.width;
            offscreenCanvas.height = sigil.height;
            const offscreenContext = offscreenCanvas.getContext('2d') as CanvasRenderingContext2D;

            // 绘制到离屏画布并处理图像数据
            offscreenContext.drawImage(sigil, 0, 0, sigil.width, sigil.height);
            const imgData = offscreenContext.getImageData(0, 0, sigil.width, sigil.height);
            const data = imgData.data;

            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] > 0) { // 非透明像素
                    data[i] = 214;
                    data[i + 1] = 253;
                    data[i + 2] = 199;
                }
            }

            offscreenContext.putImageData(imgData, 0, 0);
            const bg_img = await loadImage(staticUrl + "images/cards/misc/card_added_ability.png")
            ctx.drawImage(bg_img, 0, 0, 50, 50);
            ctx.drawImage(offscreenCanvas, 7.5, 7.5, 35, 35);

            let sigilEmissiveTexture = new DynamicTexture("sigilEmissiveTexture", {width: 50, height: 50});
            sigilEmissiveTexture.hasAlpha = true;
            sigilEmissiveTexture.getContext().drawImage(offscreenCanvas, 7.5, 7.5, 35, 35);
            sigilEmissiveTexture.update();
            sigilMat.emissiveTexture = sigilEmissiveTexture;
        }
        sigilTexture.update();
        return sigilMesh;
    }

    // 使用卡牌数据创建卡牌的通用工厂方法
    static Create(scene: Scene, presetKey: string, id?: string): Card {
        if (presetKey === "STOAT") {
            return StoatCard.Create(scene);
        }
        const preset = PRESET_CARDS[presetKey];
        if (!preset) {
            throw new Error(`Unknown preset card: ${presetKey}`);
        }

        const card = new Card(
            scene,
            presetKey,
            preset.name,
            preset.attack,
            preset.hp,
            preset.cost,
            preset.tribe,
            preset.portraitUrl,
            preset.sigilsArr,
            preset.evolvedCard,
            preset.isSpawned,
            id,
        );
        if (typeof preset.onCreate === "function") {
            preset.onCreate(card);
        }
        return card;
    }
}

export class StoatCard extends Card {
    private talkAnimationFrameId: number | null = null;
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


    constructor(scene: Scene, name: string, attack: string, HP: string, cost: CardCost) {
        super(scene,"STOAT", name, attack, HP, cost, CardTribe.CANINE);
        // let stoat_body = MeshBuilder.CreatePlane("stoat_body", {height: cardHeight, width: cardWidth});
        let stoat_body = MeshBuilder.CreatePlane("stoat_body", {
            height: 4.3742176294, // 直接将scaling乘入尺寸
            width: 3.1520229398
        });
        stoat_body.parent = this.rootNode;
        stoat_body.position = new Vector3(0.1708230972290039, -0.12214275449514389, -0.050999999046325684);


        this.stoat_body_texture = new DynamicTexture("stoat_body_texture", {width: 96.9696969697, height: 128});

        this.stoat_body_context = this.stoat_body_texture.getContext();


        let stoat_body_mat = new StandardMaterial("stoat_body_mat");

        stoat_body_mat.diffuseTexture = this.stoat_body_texture;
        stoat_body_mat.diffuseTexture.hasAlpha = true;
        stoat_body_mat.specularColor = Color3.Black();

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

    static Create(scene: Scene): Card {
        const preset = PRESET_CARDS["STOAT"];
        return new StoatCard(
            scene,
            preset.name,
            preset.attack,
            preset.hp,
            preset.cost,
        );
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
//
// // 定义另一个类，SpawnedCard
// export class SpawnedCard extends Card {
//     constructor(scene: Scene, name: string, attack: string, HP: string, cost: CardCost,tribe:string, portraitUrl = "", sigilsArr: Array<Sigil> | null = null,evolvedCard = "",  id:string = "root") {
//         super(scene, name, attack, HP, cost, tribe, portraitUrl, sigilsArr,evolvedCard, id);
//     }
// }

// /root/graduation_project/html/static/images/cards/misc/card_slot_heightmap.png


