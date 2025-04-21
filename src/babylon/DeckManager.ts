// 在场景类或独立模块中创建牌堆管理器
import {
    ActionManager,
    Animation,
    ExecuteCodeAction,
    InstancedMesh,
    Mesh,
    MeshBuilder,
    type Scene,
    StandardMaterial,
    Texture,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {staticUrl} from "../api";
import {Card} from "./Card.ts";
import {ability_guarddog, CARD_NAMES, loadImage} from "./Card-database.ts";
import {CameraManager, VIEWSTATUS} from "./CameraManager.ts";
import {globalBabylon} from "./globals.ts";
import {showGUIText} from "./GUIMessageSystem.ts";
import {eventEmitter} from "../api/socket.ts";
import {v4 as uuid} from 'uuid';


// 牌堆管理器类
export class DeckManager {
    private readonly _scene: Scene;
    private readonly _baseCardMesh: Mesh; // 基础卡牌模型

    static readonly drawCardsInterval = 250; //抽多张卡时的间隔。
    static readonly drawCardAnimationDuration = 10; //抽卡帧数，共60帧一秒

    private static creatureInstance: DeckManager; //singleton pattern creature instance
    private static squirrelInstance: DeckManager; //squirrel instance


    static cameraManager: CameraManager | undefined;
    private _cardInstances: InstancedMesh[] = []; // 卡牌实例数组
    private _deckPosition: Vector3; // 牌堆位置
    private _isAnimating: boolean = false; // 是否进行抽卡动画
    private _deckRotation = new Vector3(1.1502502007897775, 3.141592653589793, 3.141592653589793)

    static handTransformNode: TransformNode;
    static cardForPlaceTransformNode: TransformNode;//准备放置的位置。
    // 对手牌堆，用于调用已创建卡牌模型
    static opponentCards: Card[] = [];
    // 抽牌堆（未使用的卡）
    drawPile: Card[] = [];
    // 弃牌堆（已使用/死亡的卡）
    static discardPile: Card[] = [];
    // 手牌区（当前持有的卡）
    static handCards: Card[] = [];
    // 记录当前悬浮的卡牌索引和最后一次的悬浮状态
    static hoveredIndex = -1;
    static lastHoveredState = {
        index: -1,
        wasEdge: false
    };
    static handCardsCount = 0;
    static currentCard: Card | null = null;
    // 当前卡牌献祭次数。
    static currentSacrificeCount = 0;
    // 追踪已经放置卡牌的位置
    static placedCards: (Card | null)[] = new Array(8).fill(null); //
    // 用于战斗时临时存放卡牌实例
    static tempPlacedCards: (Card | null)[] = new Array(8).fill(null); //
    // 衍生卡牌池
    static spawnedCardPool: Map<string, Card[]> = new Map();

    static getPlacedCardIndex(card: Card): number {
        let res = -1;
        DeckManager.placedCards.forEach((instance:Card|null, index:number) => {
            if(instance?.id == card.id){
                res = index;
            }
        })
        return res;
    }
    //是否开启卡牌放置
    static cardPlaceActionState = true;
    //抽卡阶段所能抽取数
    static drawPhaseCount = 0; //抽牌阶段能抽取的牌数量。
    //是否处于放置阶段。
    static playStatus = false;

    private isEnable: boolean = true;

    //**放置区数组*/
    private static clawMarks:any;
    public static getCreatureInstance(): DeckManager {
        if (!DeckManager.creatureInstance) {
            if (!globalBabylon.scene || !globalBabylon.canvas) {
                throw new Error("DeckManager 必须在场景初始化后使用！");
            }
            DeckManager.creatureInstance = new DeckManager(
                new Vector3(10.003179550170898, 3.130772113800049, -15.830220222473145),
                staticUrl + "images/cards/base card/card_back.png");
        }
        return DeckManager.creatureInstance;
    }
    public static getSquirrelInstance(): DeckManager {
        if (!DeckManager.squirrelInstance) {
            if (!globalBabylon.scene || !globalBabylon.canvas) {
                throw new Error("DeckManager 必须在场景初始化后使用！");
            }
            DeckManager.squirrelInstance = new DeckManager(
                new Vector3(15.272027969360352, 3.0910263061523438, -15.741351127624512),
                staticUrl + "images/cards/base card/card_back_squirrel.png");

        }
        return DeckManager.squirrelInstance;
    }

    // 重置实例
    public static reset() {
        if (DeckManager.creatureInstance) {
            // 移除事件监听器
            DeckManager.creatureInstance = null!;
            DeckManager.squirrelInstance = null!;
        }
    }
    // 初始化牌堆
    public initDeck(initialCards: Card[]) {
        this.updateDeck(initialCards.length);
        this.drawPile = this.shuffle([...initialCards]); // 洗牌
    }

    /**
     * 将卡牌放置到对应放置区，只有show以及placed[index]=card
     * @param card 待放置卡牌
     * @param index 需要放置的位置
     */
    public placeClawMark(card: Card, index: number) {
        if(DeckManager.clawMarks[index] instanceof Mesh){
            card.show(DeckManager.clawMarks[index],Vector3.Zero(),Vector3.Zero());
        }
        DeckManager.placedCards[index]= card; // 标记为已放置
    }
    // 初始化松鼠牌堆
    public initSquirrelDeck(initialNum: number) {
        this.updateDeck(initialNum);
        for (let index = 0; index < initialNum; index++) {
            this.drawPile.push(Card.Create(this._scene, CARD_NAMES.Squirrel, uuid()));
        }
    }

    public setEnabled(isEnable: boolean) {
        if(isEnable === this.isEnable) return;
        this.isEnable = isEnable;
        if(isEnable) {
            this._baseCardMesh.setEnabled(true);
        }
        else{
            this._baseCardMesh.setEnabled(false);
        }
    }

    // 卡牌堆叠参数
    private readonly _stackParams = {
        // maxVisible: 15,     // 最大可见卡牌数
        heightStep: 0.025,  // 每张卡高度差
        rotationRange: 0.23// 随机旋转幅度
    };
    private static _cardActionMap = new Map<string, {
        placeAction: ExecuteCodeAction,
        handHoverAction: ExecuteCodeAction,
        handHoverOutAction: ExecuteCodeAction
    }>();
    private isEdgeCard(index: number): boolean {
        return index === 0 || index === DeckManager.handCardsCount;
    }

    constructor(_deckPosition: Vector3, texturePath: string) {
        this._scene = globalBabylon.scene!;
        this._deckPosition = _deckPosition;
        this._baseCardMesh = this._createBaseCard(texturePath);
        if (!DeckManager.handTransformNode) {
            DeckManager.cameraManager = CameraManager.getInstance();
            DeckManager.handTransformNode = new TransformNode("handTransformNode");
            DeckManager.handTransformNode.position = new Vector3(-0.2449856400489807, 8.417621612548828, -15.809992790222168);
            DeckManager.handTransformNode.rotation = new Vector3(1.1294828805629191, 5.147569593710105e-18, 5.698802770519521e-18);
            DeckManager.cardForPlaceTransformNode = new TransformNode("cardForPlaceTransformNode");
            DeckManager.cardForPlaceTransformNode.position = new Vector3(-9.105466842651367, 9.648472785949707, -4.0555806159973145);
            DeckManager.cardForPlaceTransformNode.rotation = new Vector3(1.3496281379015116, -3.141591216217944, -3.0547464333073426);
        }
        this.initClawMarks();
        this.setEnabled(false);
    }

    // 洗牌算法
    private shuffle(cards: Card[]): Card[] {
        return cards.sort(() => Math.random() - 0.5);
    }
    // 抽取生物卡牌
    public static drawCreatureCards(num: number) {
        const instance = this.getCreatureInstance();
        this._drawCardsFromDeck(instance, num);
    }

// 抽取松鼠卡牌
    public static drawSquirrelCards(num: number) {
        const instance = this.getSquirrelInstance();
        this._drawCardsFromDeck(instance, num);
    }
// 通用抽卡逻辑
    private static async _drawCardsFromDeck(deckInstance: DeckManager, num: number) {
        let count = 0;

        const tryDraw = async () => {
            if (count < num && deckInstance.drawPile.length > 0) {
                if (!deckInstance._isAnimating) {
                    await deckInstance.drawCardAnimation();
                    count++;
                }
                setTimeout(tryDraw, DeckManager.drawCardsInterval); // 每200ms尝试抽下一张
            }
        };

        await tryDraw();
    }
    // 创建基础卡牌模型（仅背面）
    private _createBaseCard(texturePath: string) {
        // 创建平面而非立方体
        const _baseCardMesh = MeshBuilder.CreatePlane("deckBaseCard", {
            width: 4,
            height: 6
        }, this._scene);
        // 设置背面材质
        const mat = new StandardMaterial("cardBackMat", this._scene);
        mat.diffuseTexture = new Texture(texturePath, this._scene);
        mat.backFaceCulling = false; // 允许双面渲染
        _baseCardMesh.material = mat;
        _baseCardMesh.isVisible = false;

        _baseCardMesh.position = this._deckPosition.clone();
        _baseCardMesh.rotation = this._deckRotation.clone();
        return _baseCardMesh;
    }

    // 更新牌堆显示
    private async updateDeck(count: number) {
        // 调整实例数量
        while (this._cardInstances.length > count) {
            this._cardInstances.pop()?.dispose();
        }
        // while (this._cardInstances.length < Math.min(count, this._stackParams.maxVisible))
        while (this._cardInstances.length < count) {
            const instance = this._baseCardMesh.createInstance("cardInstance");
            instance.parent = this._baseCardMesh;
            this._cardInstances.push(instance);
            instance.actionManager = new ActionManager(this._scene);
            instance.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPickTrigger, async () => {
                    if (!this._isAnimating && DeckManager.drawPhaseCount) {
                        if (await this.drawCardAnimation()) {
                            DeckManager.drawPhaseCount--;
                            if (DeckManager.drawPhaseCount === 0) {
                                eventEmitter.emit("drawCardsCompleted");
                            }
                        }
                    } else if (!DeckManager.drawPhaseCount) {
                        if (DeckManager.playStatus) {
                            //todo可能不是一张抽牌
                            showGUIText(`每回合只能抽1张卡。不要贪心哦`);
                        } else {
                            await showGUIText(`drawPhaseCount=${DeckManager.drawPhaseCount}`);

                        }
                    }
                    //else只能是isAnimating了
                })
            );
        }

        // 更新实例位置和旋转
        this._cardInstances.forEach((instance, index) => {
            const zOffset = index * this._stackParams.heightStep;
            instance.position = new Vector3(
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02,
                -zOffset
            )
            instance.rotation = new Vector3(
                0, 0, (Math.random() - 0.5) * this._stackParams.rotationRange
            )
        });

        // // 性能优化：冻结静态实例
        if (count > 10) {
            this._cardInstances.forEach(inst => {
                inst.freezeWorldMatrix();
                inst.doNotSyncBoundingInfo = true;
            });
        }
    }
    // 场上的祭品数量
    private totalPlacedCost(){
        let total = 0;
        for(let i = 0; i < 4; i++){
            if(DeckManager.placedCards[i]){
                total++;
            }
        }
        return total;
    }
    // 抽牌动画
    async drawCardAnimation() {


        if (this._cardInstances.length === 0) return false;

        const topCard = this._cardInstances[this._cardInstances.length - 1];
        // 设置动画状态为进行中
        this._isAnimating = true;
        // 使用动画系统实现平滑过渡
        Animation.CreateAndStartAnimation(
            "drawAnim",
            topCard,
            "position.y",
            60, // fps
            30, // frame count
            topCard.position.y,
            topCard.position.y - 3,
            Animation.ANIMATIONLOOPMODE_CONSTANT,
            undefined,
            () => {
                // 动画结束后处理卡牌移除
                topCard.dispose();
                this._cardInstances.pop();

                // 重置动画状态
                this._isAnimating = false;
            }
        );
        const newCard = this.drawPile.pop();
        if (newCard) {
            DeckManager.handCards.push(newCard);

            // 新的show调用带动画参数
            const startPos = new Vector3(7, 0, -0.5); // Y轴上偏移5个单位
            newCard.show(
                DeckManager.handTransformNode,
                new Vector3(4,0,-0.5), // 目标位置
                Vector3.Zero(),
                {
                    fromPosition: startPos,
                    duration: 10 // 10帧动画
                }
            );

            setTimeout(()=>{this.updateHandLayout();}, 11/60*1000);
            this.addHandActionTrigger(newCard);
            DeckManager.handCardsCount++;
            return true;
        }
        return false;
    }

// 更新手牌位置
    updateHandLayout() {
        const cardCount = DeckManager.handCards.length;
        if (cardCount === 0) return;

        // 基础参数
        const centerX = 0;           // 中心点X坐标
        const baseY = 0;            // 基础Y坐标
        let cardSpacing = 1.2;    // 卡牌间距
        const baseZ = -0.5;         // 基础Z坐标
        const deltaZ = 0.04;        // 每一张牌遮挡z轴的距离
        const deltaY = 1;
        const deltaRotationZ = -0.05;   // 每张卡牌之间的旋转角度差值

        // 计算起始X位置（使卡牌组居中）
        const totalWidth = (cardCount - 1) * cardSpacing;
        const startX = centerX - totalWidth / 2;
        const middleIndex = Math.floor(cardCount / 2);


        // 更新所有卡牌的位置和旋转
        // const updateCardPositions = () => {
        DeckManager.handCards.forEach((card, index) => {
            const xPos = startX + index * cardSpacing;

            // 计算旋转角度（以中心为0，两边对称）
            const rotationZ = (index - middleIndex) * deltaRotationZ;
            card.rootNode.rotation = new Vector3(0, 0, rotationZ);

            // 计算Z轴位置
            let zPos: number;
            let yPos = baseY;

            // 如果当前有悬浮卡牌或最后一次悬浮是边缘卡牌
            if (DeckManager.hoveredIndex !== -1 || (DeckManager.lastHoveredState.wasEdge && DeckManager.lastHoveredState.index !== -1)) {
                //当前悬浮，或边缘悬浮。
                const effectiveHoverIndex = DeckManager.hoveredIndex !== -1 ? DeckManager.hoveredIndex : DeckManager.lastHoveredState.index;
                if (index === effectiveHoverIndex) {
                    // 悬浮的卡牌位于最上层
                    zPos = baseZ - deltaZ;
                    if (DeckManager.hoveredIndex === index) {
                        yPos = baseY + deltaY;
                    }
                } else {
                    // 计算与悬浮卡牌的距离
                    const distance = Math.abs(index - effectiveHoverIndex);
                    // z轴位置随着距离增加而递减（数值增大）
                    zPos = baseZ + distance * deltaZ;
                }
            } else {
                // 初始状态：左边的牌在上面（反转堆叠顺序）
                zPos = baseZ + (cardCount - 1 - index) * deltaZ;
            }

            card.rootNode.position = new Vector3(xPos, yPos, zPos);
        });
    }
    //添加手牌actions
    addHandActionTrigger(card: Card) {
        const topMask = card.topMask;
        if (!topMask.actionManager) {
            topMask.actionManager = new ActionManager(this._scene);
        }
        const placeAction = new ExecuteCodeAction(
            ActionManager.OnLeftPickTrigger,
            () => {
                if(card.cost>this.totalPlacedCost()){
                    showGUIText(`需要${card.cost}份祭品`);
                    return;
                }
                if(!DeckManager.playStatus){
                    showGUIText("请先抽卡");
                    return;
                }
                if (DeckManager.cardPlaceActionState) {
                    DeckManager.cameraManager?.switchViewStatus(VIEWSTATUS.battleOverlook);
                    this.enablePlacementOnClawMarks(card);
                }
            }
        );

        const handHoverAction = new ExecuteCodeAction(
            ActionManager.OnPointerOverTrigger,
            () => {
                if (DeckManager.cardPlaceActionState) {
                    const index = DeckManager.handCards.indexOf(card);
                    DeckManager.hoveredIndex = index;
                    if (this.isEdgeCard(index)) {
                        DeckManager.lastHoveredState.index = index;
                        DeckManager.lastHoveredState.wasEdge = true;
                    }
                    this.updateHandLayout();
                }
            }
        );

        const handHoverOutAction = new ExecuteCodeAction(
            ActionManager.OnPointerOutTrigger,
            () => {
                if (DeckManager.cardPlaceActionState) {
                    const index = DeckManager.handCards.indexOf(card);
                    DeckManager.hoveredIndex = -1;
                    if (!this.isEdgeCard(index)) {
                        DeckManager.lastHoveredState.index = -1;
                        DeckManager.lastHoveredState.wasEdge = false;
                    }
                    this.updateHandLayout();
                }
            }
        );

        // 注册动作
        topMask.actionManager.registerAction(placeAction);
        topMask.actionManager.registerAction(handHoverAction);
        topMask.actionManager.registerAction(handHoverOutAction);

        // 存储到映射表
        DeckManager._cardActionMap.set(card.id, { placeAction, handHoverAction, handHoverOutAction });
    }
    //移除手牌actions
    removeActionTriggers(card: Card) {
        const actions = DeckManager._cardActionMap.get(card.id);
        if (!actions || !card.topMask.actionManager) return;
        card.topMask.actionManager.unregisterAction(actions.placeAction);
        card.topMask.actionManager.unregisterAction(actions.handHoverAction);
        card.topMask.actionManager.unregisterAction(actions.handHoverOutAction);

        DeckManager._cardActionMap.delete(card.id);
    }
    public async addClawActionTrigger(card:Card){
        // 加载正确的牺牲标记图片
        const img = await loadImage(staticUrl + "images/cards/misc/sacrifice_mark.png");

        // 添加新的交互逻辑
        card.topMask.actionManager = card.topMask.actionManager || new ActionManager(this._scene);

        const hoverAction = new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
            if(!DeckManager.currentCard || DeckManager.currentCard.cost <= DeckManager.currentSacrificeCount) return;
            const ctx = card.maskTexture.getContext();
            ctx.clearRect(0, 0, 400, 600);
            ctx.drawImage(img, 0, 0, 400, 600);
            // ctx.willReadFrequently = true;
            // 获取图像数据
            const imageData = ctx.getImageData(0, 0, 400, 600);
            const data = imageData.data;

            // 透明度阈值
            const alphaThreshold = 0.5; // 透明度阈值（范围 0-1）

            for (let i = 0; i < data.length; i += 4) {
                const alpha = data[i + 3] / 255; // 获取 Alpha 通道值（范围 0-1）

                if (alpha > alphaThreshold) {
                    // 如果透明度高于阈值，设置为目标颜色 #830929
                    data[i] = 131;   // R 通道
                    data[i + 1] = 9; // G 通道
                    data[i + 2] = 41; // B 通道
                } else {
                    // 如果透明度低于或等于阈值，设置为黑色 #000000
                    data[i] = 143;   // R 通道
                    data[i + 1] = 70; // G 通道
                    data[i + 2] = 32; // B 通道
                    data[i + 3] /= 2;
                }
            }
            ctx.putImageData(imageData, 0, 0);
            card.maskTexture.update();
        });
        // 移出时清除
        const hoverOutAction = new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
            if(!DeckManager.currentCard || DeckManager.currentCard.cost <= DeckManager.currentSacrificeCount) return;

            card.maskTexture.getContext().clearRect(0, 0, 400, 600);
            card.maskTexture.update();
        });

        // 点击动画
        const clickAction = new ExecuteCodeAction(ActionManager.OnLeftPickTrigger, () => {
            if(!DeckManager.currentCard || DeckManager.currentCard.cost <= DeckManager.currentSacrificeCount) return;
            const startTime = Date.now();
            const animate = () => {
                const progress = (Date.now() - startTime) / 300; // 1秒动画
                if (progress > 1) {
                    card.maskTexture.getContext().clearRect(0, 0, 400, 600);
                    card.maskTexture.update();
                    card.onSacrificeFuns.forEach(fun => fun());
                    return;
                }

                const ctx = card.maskTexture.getContext();
                const imageData = ctx.getImageData(0, 0, 400, 600);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = 131 * (1 - progress);  // R递减
                    data[i + 1] = 32*(1 - progress);

                    data[i+2] = 41*(1-progress);                   // B保持0
                }
                ctx.putImageData(imageData, 0, 0);
                card.maskTexture.update();
                requestAnimationFrame(animate);
            };
            animate();
        });

        card.topMask.actionManager.registerAction(hoverAction);
        card.topMask.actionManager.registerAction(hoverOutAction);
        card.topMask.actionManager.registerAction(clickAction);

    }

    private initClawMarks() {
        const clawMarks = this._scene.getTransformNodeByName("clawTransformNode")?.getChildren();
        DeckManager.clawMarks = clawMarks;
        if (clawMarks) {
            clawMarks.forEach((clawMark, index) => {
                if (index < 4 && clawMark instanceof Mesh) {
                    clawMark.actionManager = new ActionManager(this._scene);
                    clawMark.actionManager.registerAction(
                        new ExecuteCodeAction(
                            ActionManager.OnPickTrigger,
                            async () => {
                                if (!DeckManager.placedCards[index] && clawMarks[index] && DeckManager.currentCard && DeckManager.currentCard.cost === DeckManager.currentSacrificeCount) {
                                    const card = DeckManager.currentCard;
                                    this.removeActionTriggers(card);
                                    this.placeClawMark(card, index);
                                    //判断对方是否有守卫者印记
                                    if(!DeckManager.placedCards[index+4]){
                                        for(let i = 4; i <8; i++){
                                            if(i==index+4) continue;
                                            const opCard = DeckManager.placedCards[i];
                                            if(opCard&&opCard.sigilsArr.has(ability_guarddog)){
                                                this.placeClawMark(opCard, index+4);
                                                DeckManager.placedCards[i] = null;
                                                break;
                                            }
                                        }
                                    }

                                    // 从 handCards 中移除已放置的卡牌
                                    const cardIndex = DeckManager.handCards.indexOf(card);
                                    if (cardIndex > -1) {
                                        DeckManager.handCards.splice(cardIndex, 1);
                                    }
                                    await this.addClawActionTrigger(card);
                                    CameraManager.getInstance().switchViewStatus(VIEWSTATUS.default);
                                    // 更新手牌布局
                                    this.updateHandLayout();
                                    DeckManager.currentSacrificeCount = 0;
                                    DeckManager.currentCard = null; // 重置当前卡牌
                                    DeckManager.cardPlaceActionState = true; // 开启动画

                                }
                            }
                        )
                    );
                }
            });
        }
    }

    //等待放置
    enablePlacementOnClawMarks(card: Card) {
        setTimeout(() => {
            DeckManager.currentCard = card;
        }, 100)
        DeckManager.cardPlaceActionState = false;
        card.show(DeckManager.cardForPlaceTransformNode, Vector3.Zero(), Vector3.Zero());
    }

    //取消放置
    static cancelPlacementOnClawMarks() {
        if(DeckManager.currentCard?.rootNode.parent != DeckManager.cardForPlaceTransformNode) return;
        DeckManager.currentCard?.show(DeckManager.handTransformNode);
        DeckManager.currentCard = null;
        DeckManager.cardPlaceActionState = true;
        DeckManager.getSquirrelInstance().updateHandLayout();
    }

    /**
     * 通过预设名从衍生卡牌池中获取衍生卡牌。
     * @param presetKey CardNames的预设名字
     */
    static getSpawnedCard(presetKey: string): Card {
        const pool = this.spawnedCardPool.get(presetKey) || [];
        if (pool.length > 0) {
            return pool.pop()!;
        }
        const newCard = Card.Create(globalBabylon.scene!, presetKey);
        return newCard;
    }

    /**
     * 回收卡牌到衍生卡牌池中
     * @param card
     */
    static recycleSpawnedCard(card: Card) {
        const pool = this.spawnedCardPool.get(card.presetKey) || [];
        pool.push(card);
    }
}