// 在场景类或独立模块中创建牌堆管理器
import {
    ActionManager,
    Animation,
    ExecuteCodeAction, InstancedMesh, Mesh,
    MeshBuilder, PBRMaterial,
    type Scene,
    StandardMaterial, Texture, TransformNode,
    Vector3
} from "@babylonjs/core";
import {staticUrl} from "../api";
import {Card} from "./Card.ts";
import {CARD_NAMES} from "./Card-database.ts";


export class TableManager {
    private readonly table: Mesh;
    private readonly _scene: Scene;
    public clawTransformNode: TransformNode;
    static readonly zlevel1 = -0.51;

    constructor(scene: Scene) {
        this._scene = scene;
        this.table = this.createTableMesh();
        this.clawTransformNode = this.createBattlefield();
        this.clawTransformNode.parent = this.table;
        // this.clawTransformNode.position.y = -4.87;
        this.clawTransformNode.position.z = TableManager.zlevel1;

        // this.clawTransformNode.position = new Vector3(0.1399671733379364, -0.6597822308540344, -6.5602778816223145);
        // this.clawTransformNode.rotation = new Vector3(1.1502502007897775, 3.141592653589793, 3.141592653589793);
    }

    private createTableMesh() {
        const table = MeshBuilder.CreateBox("table", {
            width: 40,
            height: 40,
        })
        // const tableMaterial = new StandardMaterial("tableMaterial", scene);
        const pbrMaterial = new PBRMaterial("pbrTableMaterial", this._scene);
        pbrMaterial.albedoTexture = new Texture(staticUrl + "images/models/table/Poliigon_WoodVeneerOak_7760_BaseColor.jpg", this._scene); // 漫反射纹理
        pbrMaterial.metallicTexture = new Texture(staticUrl + "images/models/table/Poliigon_WoodVeneerOak_7760_Metallic.jpg")
        table.material = pbrMaterial;
        table.position = new Vector3(1.540871118621494e-16, -4.0289435386657715, -1.2582167387008667);// (debugNode as BABYLON.Mesh)
        table.rotation = new Vector3(1.1649784981529603, 3.141592653589793, 3.141592653589793);// (debugNode as BABYLON.Mesh)
        return table;
    }

    private createBattlefield() {
        // Define the card width and height
        const cardWidth = 4;
        const cardHeight = 6;

        // Define the spacing between claw marks
        const spacing = 0.8;

        // Create an array to hold the positions of the 8 claw marks
        const positions = [
            // Opponent's claw marks
            new Vector3(-1.5 * (cardWidth + spacing), -0.5 * (cardHeight + spacing), 0),
            new Vector3(-0.5 * (cardWidth + spacing), -0.5 * (cardHeight + spacing), 0),
            new Vector3(0.5 * (cardWidth + spacing), -0.5 * (cardHeight + spacing), 0),
            new Vector3(1.5 * (cardWidth + spacing), -0.5 * (cardHeight + spacing), 0),
            // Player's claw marks
            new Vector3(-1.5 * (cardWidth + spacing), 0.5 * (cardHeight + spacing), 0),
            new Vector3(-0.5 * (cardWidth + spacing), 0.5 * (cardHeight + spacing), 0),
            new Vector3(0.5 * (cardWidth + spacing), 0.5 * (cardHeight + spacing), 0),
            new Vector3(1.5 * (cardWidth + spacing), 0.5 * (cardHeight + spacing), 0),
        ];

        // Load the texture
        const clawTexture = new Texture(staticUrl + "images/cards/misc/card_slot_heightmap.png", this._scene);

        // Create a material and apply the texture
        const clawMaterial = new StandardMaterial("clawMaterial", this._scene);
        clawMaterial.diffuseTexture = clawTexture;
        clawMaterial.opacityTexture = clawTexture; // Assuming the texture has transparency

        // Create a transform node to control all claw marks
        const clawTransformNode = new TransformNode("clawTransformNode", this._scene);

        // Create claw mark planes and parent them to the transform node
        positions.forEach((position, index) => {
            const clawMark = MeshBuilder.CreatePlane(`clawMark${index}`, {height: 6, width: 4}, this._scene);
            clawMark.parent = clawTransformNode; // Parent to the transform node
            clawMark.position = position;
            // clawMark.rotation.x = Math.PI / 2; // Rotate to lie flat on the ground
            clawMark.material = clawMaterial;
        });
        return clawTransformNode;
    }
}

// 牌堆管理器类
export class DeckManager {
    private readonly _scene: Scene;
    private readonly _baseCardMesh: Mesh; // 基础卡牌模型
    private _cardInstances: InstancedMesh[] = []; // 卡牌实例数组
    private _deckPosition: Vector3; // 牌堆位置
    private _isAnimating: boolean = false; // 是否进行抽卡动画
    private _deckRotation = new Vector3(1.1502502007897775, 3.141592653589793, 3.141592653589793)

    static handTransformNode: TransformNode;
    // 抽牌堆（未使用的卡）
     drawPile: Card[] = [];
    // 弃牌堆（已使用/死亡的卡）
    discardPile: Card[] = [];
    // 手牌区（当前持有的卡）
    static handCards: Card[] = [];


    // 初始化牌堆
    initDeck(initialCards: Card[]) {
        this.updateDeck(initialCards.length);
        this.drawPile = this.shuffle([...initialCards]); // 洗牌
    }

    // 初始化松鼠牌堆
    initSquirrelDeck(initialNum: number) {
        this.updateDeck(initialNum);
        for(let index = 0; index< initialNum; index++){
            this.drawPile.push(Card.Create(this._scene,CARD_NAMES.Squirrel));
        }
    }

    // 卡牌堆叠参数
    private readonly _stackParams = {
        // maxVisible: 15,     // 最大可见卡牌数
        heightStep: 0.025,  // 每张卡高度差
        rotationRange: 0.23// 随机旋转幅度
    };

    constructor(_deckPosition: Vector3, texturePath: string, scene: Scene) {
        this._scene = scene;
        this._deckPosition = _deckPosition;
        this._baseCardMesh = this._createBaseCard(texturePath);
        if (!DeckManager.handTransformNode) {
            DeckManager.handTransformNode = new TransformNode("handTransformNode");
            DeckManager.handTransformNode.position = new Vector3(-0.2449856400489807, 8.417621612548828, -15.809992790222168);
            DeckManager.handTransformNode.rotation = new Vector3(1.1294828805629191, 5.147569593710105e-18, 5.698802770519521e-18);
        }
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
    updateDeck(count: number) {
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

        // 记录当前悬浮的卡牌索引和最后一次的悬浮状态
        let hoveredIndex = -1;
        let lastHoveredState = {
            index: -1,
            wasEdge: false
        };

        // 检查是否是边缘卡牌
        const isEdgeCard = (index: number) => {
            return index === 0 || index === cardCount - 1;
        };

        // 更新所有卡牌的位置和旋转
        const updateCardPositions = () => {
            DeckManager.handCards.forEach((card, index) => {
                const xPos = startX + index * cardSpacing;

                // 计算旋转角度（以中心为0，两边对称）
                const rotationZ = (index - middleIndex) * deltaRotationZ;
                card.box.rotation = new Vector3(0, 0, rotationZ);

                // 计算Z轴位置
                let zPos = baseZ;
                let yPos = baseY;

                // 如果当前有悬浮卡牌或最后一次悬浮是边缘卡牌
                if (hoveredIndex !== -1 || (lastHoveredState.wasEdge && lastHoveredState.index !== -1)) {
                    //当前悬浮，或边缘悬浮。
                    const effectiveHoverIndex = hoveredIndex !== -1 ? hoveredIndex : lastHoveredState.index;
                    if (index === effectiveHoverIndex) {
                        // 悬浮的卡牌位于最上层
                        zPos = baseZ - deltaZ;
                        if(hoveredIndex === index) {
                            yPos =baseY+ deltaY;
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
        };

        // 设置每张卡牌的交互
        DeckManager.handCards.forEach((card, index) => {
            if (!card.box.actionManager) {
                card.box.actionManager = new ActionManager(this._scene);
            } else {
                card.box.actionManager.actions = [];
            }

            // 鼠标悬浮效果
            card.box.actionManager.registerAction(
                new ExecuteCodeAction(
                    ActionManager.OnPointerOverTrigger,
                    () => {
                        hoveredIndex = index;
                        // 如果是边缘卡牌，记录状态
                        if (isEdgeCard(index)) {
                            lastHoveredState.index = index;
                            lastHoveredState.wasEdge = true;
                        }
                        updateCardPositions();
                    }
                )
            );

            // 鼠标移出效果
            card.box.actionManager.registerAction(
                new ExecuteCodeAction(
                    ActionManager.OnPointerOutTrigger,
                    () => {
                        hoveredIndex = -1;
                        // 如果不是边缘卡牌，清除最后的悬浮状态
                        if (!isEdgeCard(index)) {
                            lastHoveredState.index = -1;
                            lastHoveredState.wasEdge = false;
                        }
                        updateCardPositions();
                    }
                )
            );
        });

        // 初始化卡牌位置
        updateCardPositions();
    }
}
export function CreateDeckMesh1(scene: Scene) {
    const deckManager = new DeckManager(
        new Vector3(10.003179550170898, 3.130772113800049, -15.830220222473145),
        staticUrl + "images/cards/base card/card_back.png",
        scene);
    return deckManager;
}

export function CreateDeckMesh2(scene: Scene) {
    const deckManager = new DeckManager(
        new Vector3(15.272027969360352, 3.0910263061523438, -15.741351127624512),
        staticUrl + "images/cards/base card/card_back_squirrel.png",
        scene);
    return deckManager;
}