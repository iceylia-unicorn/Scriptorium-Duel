// 在场景类或独立模块中创建牌堆管理器
import {
    ActionManager,
    Animation,
    ExecuteCodeAction, InstancedMesh, Mesh,
    MeshBuilder, PBRMaterial,
    type Scene,
    StandardMaterial, Texture,
    Vector3
} from "@babylonjs/core";
import {staticUrl} from "../api";


export class TableManager {
    private table:Mesh;
    constructor(scene:Scene) {
        this.createTableMesh(scene);
    }
    private createTableMesh(scene:Scene) {
        this.table = MeshBuilder.CreateBox("table", {
            width: 40,
            height: 40,
        })
        // const tableMaterial = new StandardMaterial("tableMaterial", scene);
        const pbrMaterial = new PBRMaterial("pbrTableMaterial", scene);
        pbrMaterial.albedoTexture = new Texture(staticUrl + "images/models/table/Poliigon_WoodVeneerOak_7760_BaseColor.jpg", scene); // 漫反射纹理
        pbrMaterial.metallicTexture = new Texture(staticUrl + "images/models/table/Poliigon_WoodVeneerOak_7760_Metallic.jpg")
        this.table.material = pbrMaterial;
        this.table.position = new Vector3(1.540871118621494e-16, -4.0289435386657715, -1.2582167387008667);// (debugNode as BABYLON.Mesh)
        this.table.rotation = new Vector3(1.1649784981529603, 3.141592653589793, 3.141592653589793);// (debugNode as BABYLON.Mesh)
    }
}

// export class DeckManager {
//     // 抽牌堆（未使用的卡）
//     drawPile: Card[] = [];
//     // 弃牌堆（已使用/死亡的卡）
//     discardPile: Card[] = [];
//     // 手牌区（当前持有的卡）
//     handCards: Card[] = [];
//
//     // 初始化牌堆（示例）
//     initDeck(initialCards: Card[]) {
//         this.drawPile = this.shuffle([...initialCards]); // 洗牌
//     }
//
//     // 洗牌算法
//     private shuffle(cards: Card[]): Card[] {
//         return cards.sort(() => Math.random() - 0.5);
//     }
//
//
//     // 手牌布局参数
//     private handArea = {
//         startX: -8,
//         endX: 8,
//         y: -10,
//         z: 0,
//         cardSpacing: 2.2
//     };
//
//     // 更新手牌位置
//     updateHandLayout() {
//         this.handCards.forEach((card, index) => {
//             const totalWidth = (this.handCards.length - 1) * this.handArea.cardSpacing;
//             const startPos = this.handArea.startX + (this.handArea.endX - this.handArea.startX - totalWidth) / 2;
//
//             card.box.position = new Vector3(
//                 startPos + index * this.handArea.cardSpacing,
//                 this.handArea.y,
//                 this.handArea.z
//             );
//
//             // 添加悬停效果
//             card.box.actionManager = new ActionManager();
//             card.box.actionManager.registerAction(
//                 new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
//                     card.box.position.y += 0.5; // 悬停抬升
//                 })
//             );
//             card.box.actionManager.registerAction(
//                 new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
//                     card.box.position.y = this.handArea.y;
//                 })
//             );
//         });
//     }
//
//     drawCard(scene: Scene): Card | null {
//         if (this.drawPile.length === 0) {
//             // 重洗弃牌堆
//             this.drawPile = this.shuffle(this.discardPile);
//             this.discardPile = [];
//         }
//
//         const card = this.drawPile.pop();
//         if (card) {
//             // 创建卡牌实例
//             // const newCard = new Card(scene, ...cardParams);
//             const newCard = new Card(scene, "bat", "1", "1", "1", staticUrl + "images/cards/portraits/portrait_lice.png", 2, [ability_strafe, ability_tristrike]);
//
//             this.handCards.push(newCard);
//
//             this.updateHandLayout();
//
//             // 添加抽牌动画
//             newCard.box.position = new Vector3(0, 15, 0); // 从牌堆位置开始
//             newCard.box.addRotation(0, Math.PI * 2, 0); // 旋转动画
//             scene.onBeforeRenderObservable.add(() => {
//                 newCard.box.position.y -= 0.5; // 下落动画
//             });
//
//             return newCard;
//         }
//         return null;
//     }
//
//     // 弃牌
//     discardCard(card: Card) {
//         // 从手牌移除
//         const index = this.handCards.indexOf(card);
//         if (index > -1) this.handCards.splice(index, 1);
//
//         // 添加到弃牌堆
//         this.discardPile.push(card);
//
//         // 弃牌动画
//         card.box.addRotation(0, 0, Math.PI / 2); // 旋转倒下
//         card.box.translate(new Vector3(0, -5, 0), 1); // 下沉动画
//
//         this.updateHandLayout();
//     }
//
//     playCard(card: Card) {
//         // 从手牌移除
//         const index = this.handCards.indexOf(card);
//         if (index > -1) this.handCards.splice(index, 1);
//
//         // 战场布局逻辑
//         // this.arrangeBattleField(card);
//
//         // 触发卡牌入场效果
//         card.playedFuns.forEach(fn => fn());
//     }
//
//     // 创建牌堆3D模型
//     static createDeckMesh(scene: Scene, position: Vector3) {
//         const deck = MeshBuilder.CreateCylinder("deck", {
//             diameterTop: 3,
//             diameterBottom: 3,
//             height: 2
//         }, scene);
//
//         const mat = new StandardMaterial("deckMat", scene);
//         mat.diffuseColor = Color3.FromHexString("#2c3e50");
//         deck.material = mat;
//         deck.position = position;
//
//         // 添加点击抽牌交互
//         deck.actionManager = new ActionManager(scene);
//         deck.actionManager.registerAction(
//             new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
//                 this.drawCard(scene);
//             })
//         );
//         return deck;
//     }
// }

// 牌堆管理器类
export class Deck3DManager {
    private _scene: Scene;
    private _baseCardMesh: Mesh; // 基础卡牌模型
    private _cardInstances: InstancedMesh[] = []; // 卡牌实例数组
    private _deckPosition:Vector3; // 牌堆位置
    private _isAnimating:boolean = false; // 是否进行抽卡动画
    private _deckRotation = new Vector3(1.1502502007897775, 3.141592653589793, 3.141592653589793)

    // 卡牌堆叠参数
    private readonly _stackParams = {
        // maxVisible: 15,     // 最大可见卡牌数
        heightStep: 0.015,  // 每张卡高度差
        rotationRange: 0.13// 随机旋转幅度
    };

    constructor(_deckPosition: Vector3,texturePath: string,scene: Scene) {
        this._scene = scene;
        this._deckPosition = _deckPosition;
        this._createBaseCard(texturePath);
    }

    // 创建基础卡牌模型（仅背面）
    private _createBaseCard(texturePath: string) {
        // 创建平面而非立方体
        this._baseCardMesh = MeshBuilder.CreatePlane("deckBaseCard", {
            width: 4,
            height: 6
        }, this._scene);


        // 设置背面材质
        const mat = new StandardMaterial("cardBackMat", this._scene);
        mat.diffuseTexture = new Texture(texturePath, this._scene);
        mat.backFaceCulling = false; // 允许双面渲染
        this._baseCardMesh.material = mat;
        this._baseCardMesh.isVisible = false;

        this._baseCardMesh.position = this._deckPosition.clone();
        this._baseCardMesh.rotation = this._deckRotation.clone();
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
                0,0,(Math.random() - 0.5) * this._stackParams.rotationRange
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
    }
}
export function CreateDeckMesh1(scene: Scene) {
    const deckManager = new Deck3DManager(
        new Vector3(10.003179550170898, 3.130772113800049, -15.830220222473145),
        staticUrl + "images/cards/base card/card_back.png",
        scene);
    return deckManager;
}
export function CreateDeckMesh2(scene: Scene) {
    const deckManager = new Deck3DManager(
        new Vector3(15.272027969360352, 3.0910263061523438, -15.741351127624512),
        staticUrl + "images/cards/base card/card_back_squirrel.png",
        scene);
    return deckManager;
}