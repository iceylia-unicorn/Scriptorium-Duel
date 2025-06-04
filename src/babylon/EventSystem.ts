import {staticUrl} from "../api";
import {
    ActionManager,
    Animation,
    type AssetContainer,
    Color3,
    DynamicTexture,
    ExecuteCodeAction,
    loadAssetContainerAsync,
    Mesh,
    MeshBuilder,
    Quaternion,
    Scene,
    StandardMaterial,
    Texture,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {globalBabylon} from "./globals.ts";
import {Card} from "./Card.ts";
import MessageQueue from "./GUIMessageSystem.ts";
import {CARD_INDICES, loadImage} from "./Card-database.ts";
import {CardRarity} from "./Card-types.ts";
import {gameState} from "./gameState.ts";
import {DeckManager} from "./DeckManager.ts";
import {TableManager} from "./TableManager.ts";
import {LightManager} from "./LightManager.ts";
import {CameraManager, VIEWSTATUS} from "./CameraManager.ts";
import {BattleManager} from "./BattleManager.ts";

const EVENT_WIDTH = 4;
const EVENT_HEIGHT = 6;
const EVENT_SPACING = 2;
export class GameEvent {
    public rootNode: TransformNode;
    public plane!: Mesh;
    private titleTexture!: DynamicTexture;
    private descTexture!: DynamicTexture;

    constructor(
        private scene: Scene,
        public config: EventConfig,
        private onSelected: () => void
    ) {
        this.rootNode = new TransformNode(`event-${config.title}`, scene);
        this.initializeComponents();
    }

    private initializeComponents() {
        // 创建事件平面
        this.plane = MeshBuilder.CreatePlane("eventPlane", {
            width: EVENT_WIDTH,
            height: EVENT_HEIGHT
        }, this.scene);

        // 设置材质
        const mat = new StandardMaterial("eventMat", this.scene);
        mat.diffuseTexture = new Texture(
             staticUrl + "images/event/event_bg.png",
            this.scene
        );
        mat.specularColor = Color3.Black();
        this.plane.material = mat;

        // 创建文字组件
        this.createTextElements();
        this.setupInteractivity();
    }

    private createTextElements() {
        this.titleTexture = new DynamicTexture("titleTexture", { width: 512, height: 256 });
        this.descTexture = new DynamicTexture("descTexture", { width: 512, height: 512 });

        const titlePlane = this.createTextPlane(
            this.titleTexture,
            3.5,
            3,
            new Vector3(0, 1, -0.01)
        );

        const descPlane = this.createTextPlane(
            this.descTexture,
            3.5,
            3,
            new Vector3(0, -0.7, -0.01)
        );

        this.updateText();

        this.plane.parent = this.rootNode;
        titlePlane.parent = this.rootNode;
        descPlane.parent = this.rootNode;
    }

    private setupInteractivity() {
        this.plane.isPickable = true;
        this.plane.actionManager = new ActionManager(this.scene);
        this.plane.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                this.onSelected();
                this.config.onSelect(this.scene);
            })
        );
    }
    private createTextPlane(texture: DynamicTexture, width: number, height: number, position: Vector3): Mesh {
        const plane = MeshBuilder.CreatePlane("textPlane", { width, height }, this.rootNode.getScene());
        const mat = new StandardMaterial("textMat", this.rootNode.getScene());
        mat.diffuseTexture = texture;
        mat.specularColor = Color3.Black();

        mat.diffuseTexture.hasAlpha = true;

        plane.isPickable = false;
        plane.enablePointerMoveEvents = false;
        plane.material = mat;
        plane.position = position;
        return plane;
    }

    private updateText(): void {
        this.titleTexture.clear();
        this.titleTexture.drawText(
            this.config.title,
            null, null,
            "bold 70px KaiTi",
            "#FFFFFF",
            "transparent",
            true,
            true
        );

        // 自动换行逻辑
        this.descTexture.clear();
        // const canvas = this.descTexture.getContext().canvas;
        const context = this.descTexture.getContext();
        const maxWidth = 400; // 根据实际布局调整（512 - 左右边距）
        const fontSize = 40;
        const lineHeight = 50;
        let yOffset = 250;

        // 设置字体以正确测量宽度
        context.font = `bold ${fontSize}px KaiTi`;

        // 按字符自动换行（适配中文）
        const chars = this.config.description.split('');
        let currentLine = '';

        chars.forEach((char, index) => {
            const testLine = currentLine + char;
            const metrics = context.measureText(testLine);

            if (metrics.width > maxWidth && currentLine !== '') {
                // 绘制当前行并重置
                this.descTexture.drawText(
                    currentLine,
                    50, yOffset,
                    `bold ${fontSize}px KaiTi`,
                    "#FFFFFF",
                    "transparent",
                    true,
                    true
                );
                yOffset += lineHeight;
                currentLine = char;
            } else {
                currentLine = testLine;
            }

            // 绘制最后一行
            if (index === chars.length - 1) {
                this.descTexture.drawText(
                    currentLine,
                    50, yOffset,
                    `bold ${fontSize}px KaiTi`,
                    "#FFFFFF",
                    "transparent",
                    true,
                    true
                );
            }
        });
    }
    public show(): void {
        this.rootNode.setEnabled(true);
    }

    public hide(): void {
        this.rootNode.setEnabled(false);
    }
    // 其他方法保持相同...
}

type EventConfig = {
    title: string;
    description: string;
    onSelect: (scene: Scene) => void;
};
const stoneContainer = null as null | AssetContainer;
const defaultEventPool: EventConfig[] = [
    {
        title: "卡牌移除",
        description: "\u3000向骷髅领主献祭，它将给予你回报。",
        onSelect: () => {/* 实现强化逻辑 */
        }
    },
    {
        title: "神秘石堆",
        description: "\u3000拥有神奇的魔力，能赋予卡牌新的印记，但代价是什么呢？",
        onSelect: async (scene: Scene) => {/* 实现恢复逻辑 */

            if (!stoneContainer) {
                const stoneContainer = await loadAssetContainerAsync("models/stone1.glb", scene);
                stoneContainer.addAllToScene();
                console.log(stoneContainer);

                const stoneRootNode = stoneContainer.meshes[0];
                const button = stoneContainer.meshes[3];
                const img = await loadImage(staticUrl + "images/cards/misc/sacrifice_button.png");
                const buttonMark = MeshBuilder.CreatePlane("buttonMark", {
                    width: 4,
                    height: 6
                }, scene)
                const buttonMarkTexture = new DynamicTexture("buttonMarkTexture", {
                    width: 400,
                    height: 600,
                })
                const buttonMarkMat = new StandardMaterial("buttonMarkMat");
                buttonMarkMat.diffuseTexture = buttonMarkTexture;
                buttonMarkMat.specularColor = Color3.Black();
                buttonMarkMat.diffuseTexture.hasAlpha = true;
                buttonMark.material = buttonMarkMat;
                buttonMark.isPickable = false;
                const ctx = buttonMarkTexture.getContext();
                ctx.drawImage(img, 0, 0, 400, 600);
                buttonMarkTexture.update();

                const anchor = new TransformNode("anchor");
                anchor.parent = button;
                anchor.position.x = 0;
                anchor.position.y = 0.01;
                anchor.scaling = new Vector3(0.12, -0.12, 0.12);
                anchor.rotationQuaternion = new Quaternion(0.522090867562048, 0.4853710856767716, -0.4936240510807251, 0.49816797507659394);

                buttonMark.parent = anchor;


                const clickAnimation1 = stoneContainer.animationGroups[0];
                const clickAnimation2 = stoneContainer.animationGroups[1];
                const cards = DeckManager.getCreatureInstance().drawPile.filter(card => {
                    return card.initSigilNum === card.curSigilNum;
                });

                clickAnimation1.stop();
                clickAnimation2.stop();

                stoneRootNode.rotation = new Vector3(-0.43, -Math.PI, -Math.PI);
                stoneRootNode.position = new Vector3(0, -3.37, 8.15)
                stoneRootNode.scaling = new Vector3(7, -7, 7);
                button.setEnabled(false);
                LightManager.getInstance().shadowGenerator.addShadowCaster(stoneRootNode);
                CameraManager.getInstance().switchViewStatus(VIEWSTATUS.mysteriousStone);
                LightManager.getInstance().setSpotLightIntensity(400);


                const beSacrificedCard = await DeckManager.getCreatureInstance().arrangeStackedCards(cards.filter(card=> card.initSigilNum !== 0), {
                    parentNode: TableManager.getInstance().table,
                    startPosition: new Vector3(-4.347029685974121, -7.494479179382324, -0.9291388392448425),
                })
                const desPos1 = new Vector3(-0.034243304282426834, -4.276679039001465, 0.9383827447891235)
                const desRotation = new Vector3(1.1443238634601753, 3.1111260855637806, -1.574310142563471)
                await beSacrificedCard.show(null, desPos1, desRotation, {
                    fromPosition: beSacrificedCard.rootNode.position,
                    duration: 12
                });

                const evolvedCard = await DeckManager.getCreatureInstance().arrangeStackedCards(cards.filter(card => card.id !== beSacrificedCard.id), {
                    parentNode: TableManager.getInstance().table,
                    startPosition: new Vector3(-4.347029685974121, -7.494479179382324, -0.9291388392448425),
                })
                const desPos2 = new Vector3(6.741579481359748e-18, -2.728750228881836, 6.255321025848389);
                const desRotation2 = new Vector3(0.4927219060757452, 1.7086838653942892e-18, 3.705846117053595e-18)
                await evolvedCard.show(null, desPos2, desRotation2, {
                    fromPosition: evolvedCard.rootNode.position,
                    duration: 12
                });
                CameraManager.getInstance().battleDefaultCamera.rotation.x = 1.2217304763960306;

                button.actionManager = new ActionManager();
                button.actionManager.registerAction(
                    new ExecuteCodeAction(
                        ActionManager.OnPointerOverTrigger, () => {
                            console.log(1);
                            // ctx.clearRect(0, 0, 400, 600);
                            const imageData = ctx.getImageData(0, 0, 400, 600);
                            const data = imageData.data;
                            const alphaThreshold = 0.5; // 透明度阈值（范围 0-1）
                            for (let i = 0; i < data.length; i += 4) {
                                const alpha = data[i + 3] / 255; // 获取 Alpha 通道值（范围 0-1）

                                if (alpha > alphaThreshold) {
                                    // 如果透明度高于阈值，设置为目标颜色 #830929
                                    data[i] = 214;   // R 通道
                                    data[i + 1] = 253; // G 通道
                                    data[i + 2] = 199; // B 通道
                                }
                            }
                            ctx.putImageData(imageData, 0, 0);
                            buttonMarkTexture.update();
                        }
                    )
                )
                button.actionManager.registerAction(
                    new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
                            ctx.clearRect(0, 0, 400, 600);
                            ctx.drawImage(img, 0, 0, 400, 600);
                            buttonMarkTexture.update();
                        }
                    )
                )
                button.actionManager.registerAction(
                    new ExecuteCodeAction(
                        ActionManager.OnPickTrigger,
                        () => {
                            buttonMark.setEnabled(false);
                            const createRotationAnimation = (axis: string) => {
                                return new Animation(
                                    `rotation${axis.toUpperCase()}Anim`,
                                    `rotation.${axis}`,
                                    60,
                                    Animation.ANIMATIONTYPE_FLOAT,
                                    Animation.ANIMATIONLOOPMODE_CONSTANT
                                );
                            };

                            const animationX = createRotationAnimation('x');
                            const animationY = createRotationAnimation('y');
                            const animationZ = createRotationAnimation('z');

                            const rotationKeyframes = [
                                {frame: 0, value: new Vector3(0.492128, -0.053363, -0.025233)},
                                {frame: 4, value: new Vector3(0.400581, -0.662001, -0.295028)},
                                {frame: 8, value: new Vector3(-0.225282, -2.011806, -0.442021)},
                                {frame: 12, value: new Vector3(-0.455012, 2.717157, 0.196047)},
                                {frame: 16, value: new Vector3(0.395443, 0.680112, 0.302048)},
                                {frame: 20, value: new Vector3(0.492548, 0.028821, 0.013632)}
                            ];

                            const buildAxisKeys = (axisIndex: number) => {
                                type Vector3Axis = 'x' | 'y' | 'z';

                                const axis = ['x', 'y', 'z'][axisIndex] as Vector3Axis;

                                return rotationKeyframes.map(kf => ({
                                    frame: kf.frame,
                                    value: kf.value[axis]
                                }));
                            };
                            animationX.setKeys(buildAxisKeys(0));
                            animationY.setKeys(buildAxisKeys(1));
                            animationZ.setKeys(buildAxisKeys(2));

                            evolvedCard.rootNode.animations = [animationX, animationY, animationZ];

                            scene.beginAnimation(
                                evolvedCard.rootNode,
                                0,    // 起始帧
                                20,   // 结束帧（匹配最后一个关键帧）
                                false
                            );

                            clickAnimation1.play();
                            clickAnimation2.play();
                            beSacrificedCard.sigilsArr.forEach(sigil => {
                                sigil.addFun(evolvedCard);
                            })
                            // Deckmanager.
                            beSacrificedCard.destroy();
                        }
                    )
                )
                button.setEnabled(true);

            }
            // const stoneContainer = stoneContainer || null;
        }
    },
    {
        title: "营火",
        description: "\u3000前方有一堆燃烧的火焰。",
        onSelect: () => {/* 实现恢复逻辑 */
        }
    },
    {
        title: "真菌学家",
        description: "\u3000一位技艺高超的工匠，能够将卡牌组合。",
        onSelect: () => {
        }
    },
    {
        title: "商人",
        description: "\u3000贩卖卡牌的商人。",
        onSelect: async (scene:Scene)=>{
            const cards = [] as Card[];
            const newCards = [] as Card[];
            MessageQueue.getInstance().showMessage("每张卡价值五金币")
            const source = CARD_INDICES.byRarity[CardRarity.COMMON];
            console.log(source);

            for (let i = 0; i < 6; i++) {
                const randomIndex = Math.floor(Math.random() * source.length);
                const newCard = Card.Create(scene, source[randomIndex]);
                cards.push(newCard);
                source.splice(randomIndex, 1);
                newCard.topMask.actionManager = new ActionManager();
                newCard.topMask.actionManager.registerAction(new ExecuteCodeAction(
                    ActionManager.OnLeftPickTrigger,
                    async () => {
                        if (gameState.golds < 5) {
                            MessageQueue.getInstance().showMessage("你没有足够的金币")
                            return;
                        }
                        gameState.golds -= 5;
                        DeckManager.getCreatureInstance().drawPile.push(newCard);
                        cards.splice(cards.indexOf(newCard), 1);
                        newCard.hide();
                        newCards.push(newCard);
                        // todo 需要进行通信

                        if (cards.length <= 0 || gameState.golds < 5) {
                            await MessageQueue.getInstance().showMessage("谢谢惠顾，欢迎下次再来")
                            for (const card of cards) {
                                console.log(card);
                                await card.show(undefined, card.rootNode.position.add(new Vector3(0, 12, -10)), card.rootNode.rotation, {
                                    fromPosition: card.rootNode.position,
                                    duration: 8,
                                });
                                card.destroy();
                            }
                            const batleManager = await BattleManager.getInstance();
                            batleManager.setEnabled(true);

                            await batleManager.pendingPhase()
                            CameraManager.getInstance().switchViewStatus(VIEWSTATUS.default);

                            // await BattleManager.pendingPhase();
                        }
                    }
                ))
            }
            await TableManager.getInstance().layoutCardsGrid(cards, {
                maxPerRow: 3
            });
        }

    }
];


export class EventSystem {
    private activeEvents: GameEvent[] = [];
    private rootNode: TransformNode;
    static instance: EventSystem;

    constructor(
        private scene: Scene,
        private eventPool: EventConfig[] = defaultEventPool,
        private positions: Vector3[] = this.calculateDefaultPositions()
    ) {
        this.rootNode = new TransformNode("eventRoot", scene);
        this.rootNode.position = new Vector3(-0.44696244597435, 9.39893627166748, -10.858449935913086);
        this.rootNode.rotation = new Vector3(0.9794192342786161, 7.769913576556647e-18, 9.388295618134214e-18);
    }
    public static getInstance(){
        if(!EventSystem.instance){
            if (!globalBabylon.scene || !globalBabylon.canvas) {
                throw new Error("EventManager 必须在场景初始化后使用！");
            }
            EventSystem.instance = new EventSystem(globalBabylon.scene);
        }
        return EventSystem.instance;
    }
    public async showEvents(count = 3): Promise<EventConfig> {
        return new Promise((resolve) => {
            const selectedEvents = this.getRandomEvents(count);

            this.activeEvents = selectedEvents.map((config, index) => {
                const event = new GameEvent(this.scene, config, () => {
                    this.cleanup();
                    resolve(config);
                });

                event.rootNode.parent = this.rootNode;
                event.rootNode.position = this.positions[index] || Vector3.Zero();
                event.show();
                return event;
            });
        });
    }

    public cleanup() {
        this.activeEvents.forEach(event => {
            event.rootNode.dispose();
            event.plane.dispose();
        });
        this.activeEvents = [];
    }

    private calculateDefaultPositions(): Vector3[] {
        return [-1, 0, 1].map(x =>
            new Vector3(x * (EVENT_WIDTH + EVENT_SPACING), 0, 0)
        );
    }

    private getRandomEvents(count: number): EventConfig[] {
        return [...this.eventPool]
            .sort(() => Math.random() - 0.5)
            .slice(0, count);
    }
}

