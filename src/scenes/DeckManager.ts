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
import type {Card} from "./Card.ts";


export class TableManager {
    private table: Mesh;
    private _scene: Scene;
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
    private _scene: Scene;
    private _baseCardMesh: Mesh; // 基础卡牌模型
    private _cardInstances: InstancedMesh[] = []; // 卡牌实例数组
    private _deckPosition: Vector3; // 牌堆位置
    private _isAnimating: boolean = false; // 是否进行抽卡动画
    private _deckRotation = new Vector3(1.1502502007897775, 3.141592653589793, 3.141592653589793)
    // private squirrelInitNum = 10; //初始松鼠卡数量
    // private handCardsInitNum = 4; //初始手牌数量

    // 抽牌堆（未使用的卡）
    drawPile: Card[] = [];
    // 弃牌堆（已使用/死亡的卡）
    discardPile: Card[] = [];
    // 手牌区（当前持有的卡）
    handCards: Card[] = [];

    // 初始化牌堆
    initDeck(initialCards: Card[]) {
        this.updateDeck(initialCards.length);
        this.drawPile = this.shuffle([...initialCards]); // 洗牌
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
    }

    // 洗牌算法
    private shuffle(cards: Card[]): Card[] {
        return cards.sort(() => Math.random() - 0.5);
    }

    // 手牌布局参数
    private handArea = {
        startX: -8,
        endX: 8,
        y: -10,
        z: 0,
        cardSpacing: 2.2
    };

    // 更新手牌位置
    updateHandLayout() {
        this.handCards.forEach((card, index) => {
            const totalWidth = (this.handCards.length - 1) * this.handArea.cardSpacing;
            const startPos = this.handArea.startX + (this.handArea.endX - this.handArea.startX - totalWidth) / 2;

            card.box.position = new Vector3(
                startPos + index * this.handArea.cardSpacing,
                this.handArea.y,
                this.handArea.z
            );

            // 添加悬停效果
            card.box.actionManager = new ActionManager();
            card.box.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
                    card.box.position.y += 0.5; // 悬停抬升
                })
            );
            card.box.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
                    card.box.position.y = this.handArea.y;
                })
            );
        });
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
            this.handCards.push(newCard);
            this.updateHandLayout();
        }
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