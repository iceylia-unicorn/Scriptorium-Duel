// 在场景类或独立模块中创建牌堆管理器
import {
    ActionManager,
    Animation,
    ExecuteCodeAction, InstancedMesh, Mesh,
    MeshBuilder,
    type Scene,
    StandardMaterial, Texture, TransformNode,
    Vector3
} from "@babylonjs/core";
import {staticUrl} from "../api";
import {Card} from "./Card.ts";
import {CARD_NAMES} from "./Card-database.ts";
import {CameraManager} from "./CameraManager.ts";
import {globalBabylon} from "./globals.ts";


// 牌堆管理器类
export class DeckManager {
    private readonly _scene: Scene;
    private readonly _baseCardMesh: Mesh; // 基础卡牌模型

    private static creatureInstance: DeckManager; //singleton pattern creature instance
    private static squirrelInstance: DeckManager; //squirrel instance


    static cameraManager: CameraManager | undefined;
    private _cardInstances: InstancedMesh[] = []; // 卡牌实例数组
    private _deckPosition: Vector3; // 牌堆位置
    private _isAnimating: boolean = false; // 是否进行抽卡动画
    private _deckRotation = new Vector3(1.1502502007897775, 3.141592653589793, 3.141592653589793)

    static handTransformNode: TransformNode;
    static cardForPlaceTransformNode: TransformNode;//准备放置的位置。
    // 抽牌堆（未使用的卡）
    drawPile: Card[] = [];
    // 弃牌堆（已使用/死亡的卡）
    discardPile: Card[] = [];
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
    // 用于跟踪已放置卡牌的位置
    static placedClawMarks: Set<number> = new Set();
    static cardPlaceActionState = true;

    private isEnable: boolean = true;

    // static cardHoverOnAction =
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

    // static cardHoverOnAction =
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

    // 初始化松鼠牌堆
    public initSquirrelDeck(initialNum: number) {
        this.updateDeck(initialNum);
        for (let index = 0; index < initialNum; index++) {
            this.drawPile.push(Card.Create(this._scene, CARD_NAMES.Squirrel));
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
    private updateDeck(count: number) {
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
                new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                    if (!this._isAnimating) {
                        this.drawCardAnimation();
                    }
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

    // 抽牌动画
    drawCardAnimation() {


        if (this._cardInstances.length === 0) return;

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
            newCard.show(DeckManager.handTransformNode, Vector3.Zero(), Vector3.Zero());
            this.updateHandLayout();
            this.addActionTrigger(newCard);
            DeckManager.handCardsCount++;
            // this.enableCardPlacement(); // Enable card placement after drawing a card
        }
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
            card.box.rotation = new Vector3(0, 0, rotationZ);

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

            card.box.position = new Vector3(xPos, yPos, zPos);
        });
    }

    addActionTrigger(card: Card) {

        const topMask = card.topMask;
        // const index = DeckManager.handCardsCount;
        if (!topMask.actionManager) {
            topMask.actionManager = new ActionManager(this._scene);
        }
        // 检查是否是边缘卡牌
        const isEdgeCard = (index: number) => {
            return index === 0 || index === DeckManager.handCardsCount;
        };
        //卡牌放置
        topMask.actionManager.registerAction(
            new ExecuteCodeAction(
                ActionManager.OnLeftPickTrigger,
                () => {
                    if (DeckManager.cardPlaceActionState) {
                        DeckManager.cameraManager?.switchToBattleOverlook();
                        this.enablePlacementOnClawMarks(card);

                    }

                }
            )
        );
        // 鼠标悬浮效果
        topMask.actionManager.registerAction(
            new ExecuteCodeAction(
                ActionManager.OnPointerOverTrigger,
                () => {
                    if (DeckManager.cardPlaceActionState) {
                        const index = DeckManager.handCards.indexOf(card);
                        DeckManager.hoveredIndex = index;
                        // 如果是边缘卡牌，记录状态
                        if (isEdgeCard(index)) {
                            DeckManager.lastHoveredState.index = index;
                            DeckManager.lastHoveredState.wasEdge = true;
                        }
                        this.updateHandLayout();
                    }

                }
            )
        );

        // 鼠标移出效果
        topMask.actionManager.registerAction(
            new ExecuteCodeAction(
                ActionManager.OnPointerOutTrigger,
                () => {
                    if (DeckManager.cardPlaceActionState) {
                        const index = DeckManager.handCards.indexOf(card);

                        DeckManager.hoveredIndex = -1;
                        // 如果不是边缘卡牌，清除最后的悬浮状态
                        if (!isEdgeCard(index)) {
                            DeckManager.lastHoveredState.index = -1;
                            DeckManager.lastHoveredState.wasEdge = false;
                        }
                        this.updateHandLayout();
                    }
                }
            )
        );

    }

    private initClawMarks() {
        const clawMarks = this._scene.getTransformNodeByName("clawTransformNode")?.getChildren();
        if (clawMarks) {
            clawMarks.forEach((clawMark, index) => {
                if (index < 4 && clawMark instanceof Mesh) {
                    clawMark.actionManager = new ActionManager(this._scene);
                    clawMark.actionManager.registerAction(
                        new ExecuteCodeAction(
                            ActionManager.OnPickTrigger,
                            () => {
                                if (!DeckManager.placedClawMarks.has(index) && DeckManager.currentCard) {
                                    const card = DeckManager.currentCard;
                                    card.topMask.actionManager!.actions = [];

                                    card.box.parent = clawMark;
                                    card.box.position = Vector3.Zero();
                                    card.box.rotation = Vector3.Zero();
                                    DeckManager.placedClawMarks.add(index); // 标记为已放置
                                    // 禁用卡牌交互，防止再次放置
                                    card.topMask.actionManager!.actions = [];

                                    // 从 handCards 中移除已放置的卡牌
                                    const cardIndex = DeckManager.handCards.indexOf(card);
                                    if (cardIndex > -1) {
                                        DeckManager.handCards.splice(cardIndex, 1);
                                    }

                                    // 更新手牌布局
                                    this.updateHandLayout();
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
        card.show(DeckManager.cardForPlaceTransformNode, Vector3.Zero(), Vector3.Zero())
        DeckManager.cardPlaceActionState = false;
        setTimeout(() => {
            DeckManager.currentCard = card;
        }, 300)

    }

    //取消放置
    static cancelPlacementOnClawMarks() {
        DeckManager.currentCard?.show(DeckManager.handTransformNode);
        DeckManager.currentCard = null;
        DeckManager.cardPlaceActionState = true;
    }
}