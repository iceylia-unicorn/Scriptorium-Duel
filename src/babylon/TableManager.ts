import {
    Mesh,
    MeshBuilder,
    PBRMaterial,
    type Scene,
    StandardMaterial,
    Texture,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {globalBabylon} from "./globals.ts";
import {staticUrl} from "../api";
import type {Card} from "./Card.ts";
import {CameraManager} from "./CameraManager.ts";

export class TableManager {
    private static instance:TableManager;

    private readonly table: Mesh;
    private readonly _scene: Scene;
    public clawTransformNode: TransformNode;
    private isBattleFiledEnable: boolean = true;
    static readonly zlevel1 = -0.51;
    // create instance under singleton pattern.
    public static reset() {
        if (TableManager.instance) {
            TableManager.instance = null!;
        }
    }
    public static getInstance(): TableManager {
        if (!TableManager.instance) {
            // create instance after babylon init.
            if (!globalBabylon.scene) {
                throw new Error("TableManager 必须在场景初始化后使用！");
            }
            TableManager.instance = new TableManager();
        }
        return TableManager.instance;
    }
    private constructor() {
        this._scene = globalBabylon.scene!;
        this.table = this.createTableMesh();
        this.clawTransformNode = this.createBattlefield();
        this.clawTransformNode.parent = this.table;
        // this.clawTransformNode.position.y = -4.87;
        this.clawTransformNode.position.z = TableManager.zlevel1;
        this.setBattleFiledEnabled(false);
    }

    private createTableMesh() {
        const table = MeshBuilder.CreateBox("table", {
            width: 40,
            height: 40,
        })
        const pbrMaterial = new PBRMaterial("pbrTableMaterial", this._scene);
        pbrMaterial.albedoTexture = new Texture(staticUrl + "images/models/table/Poliigon_WoodVeneerOak_7760_BaseColor.jpg", this._scene); // 漫反射纹理
        pbrMaterial.metallicTexture = new Texture(staticUrl + "images/models/table/Poliigon_WoodVeneerOak_7760_Metallic.jpg")
        table.material = pbrMaterial;
        table.position = new Vector3(1.540871118621494e-16, -4.0289435386657715, -1.2582167387008667);// (debugNode as BABYLON.Mesh)
        table.rotation = new Vector3(1.1649784981529603, 3.141592653589793, 3.141592653589793);// (debugNode as BABYLON.Mesh)
        return table;
    }

    // show or hide battlefield
    public setBattleFiledEnabled(isEnable: boolean) {
        if(isEnable === this.isBattleFiledEnable) return; //if no change, return.
        this.isBattleFiledEnable = isEnable;
        if(isEnable){ //choose to show
            this.clawTransformNode.setEnabled(true);
        }
        else{
            this.clawTransformNode.setEnabled(false);
        }
    }
    // 卡牌展示布局。
    public layoutCardsGrid(cards: Card[], options?: {
        maxPerRow?: number,
        horizontalSpacing?: number,
        verticalSpacing?: number
    }) {
        const config = {
            maxPerRow: 5, // 默认每行5张
            horizontalSpacing: 0.8, // 水平间距
            verticalSpacing: 1.2, // 垂直间距（卡牌高度+间隔）
            ...options
        };

        const cardWidth = 4;  // 与Card.ts定义保持一致
        const cardHeight = 6;

        // 以桌子中心为基准点
        const tableCenter = new Vector3(0, 3, 0);

        cards.forEach((card, index) => {
            // 计算行列位置
            const row = Math.floor(index / config.maxPerRow);
            const col = index % config.maxPerRow;

            // 计算当前行实际卡牌数量（最后一行可能不满）
            const cardsInCurrentRow = Math.min(
                cards.length - row * config.maxPerRow,
                config.maxPerRow
            );

            // 计算水平居中偏移
            const rowWidth = (cardsInCurrentRow - 1) * (cardWidth + config.horizontalSpacing);
            const startX = tableCenter.x - rowWidth / 2;

            // 计算垂直位置（从中心向下排列）
            const yOffset = row * (cardHeight + config.verticalSpacing);

            // 计算最终位置
            const position = new Vector3(
                startX + col * (cardWidth + config.horizontalSpacing),
                tableCenter.y - yOffset,
                TableManager.zlevel1 - 0.01 * row // 层级微调防止渲染重叠
            );

            // 设置卡牌位置和父级
            card.show(this.table, position, new Vector3(0,0,0));

            // 重置旋转角度
            card.box.rotation.z = 0;

            // 调整卡牌层级关系
            card.box.position.z = TableManager.zlevel1 - 0.01 * row;
        });
        // CameraManager.getInstance().switchToBattleOverlook();
        CameraManager.getInstance().switchAndLockOverlook()
        // setTimeout(()=>{
        //     CameraManager.getInstance().unlockOverlook();
        // },2000);

    }
    // battlefield mesh init
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
            clawMark.material = clawMaterial;
            if (index > 3) {
                clawMark.rotation.z = Math.PI;
            }
        });
        return clawTransformNode;
    }

}