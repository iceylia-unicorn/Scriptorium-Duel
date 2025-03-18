import {AssetContainer, LoadAssetContainerAsync} from "@babylonjs/core";
import {globalBabylon} from "./globals.ts";

export class BattleManager {
    private static instance: BattleManager;//单例
    public turnOverAnimation;
    private isEnabled  = true; //是否启用
    private bellContainer:AssetContainer;

    // 单例模式获取唯一实例
    public static async getInstance(): Promise<BattleManager> {
        if (!BattleManager.instance) {
            // 确保已初始化
            if (!globalBabylon.scene || !globalBabylon.canvas) {
                throw new Error("BattleManager 必须在场景初始化后使用！");
            }
            // 异步构造，先运行异步，再返回构造。
            const bellContainer = await LoadAssetContainerAsync("models/bell.glb", globalBabylon.scene!);
            BattleManager.instance = new BattleManager(bellContainer)
        }
        return BattleManager.instance;
    }

    private constructor(bellContainer: AssetContainer) {
        this.bellContainer = bellContainer;
        bellContainer.animationGroups[0].stop();
        this.turnOverAnimation = bellContainer.animationGroups[0];
        bellContainer.addAllToScene();
    }
    public enable(isEnable:boolean): void {
        if(this.isEnabled === isEnable) return;
        this.isEnabled  = isEnable;

        if(isEnable){
            //启用战斗场景
            this.bellContainer.addAllToScene();
        }
        else{
            this.bellContainer.removeAllFromScene();
        }
    }

    //回合结束
    turnOver() {
        //播放动画


        //更改状态
    }

    public playBellTurnOver(): void {
        // this.turnOverAnimate = true;

    }

}


// // import type {TableManager} from "./DeckManager.ts";
//
// // BattleManager.ts 扩展
// import type { DeckManager } from "./DeckManager.ts";
//
// export class BattleManager {
//     // 现有属性...
//     // private enemyCards: Card[] = []; // 敌方卡牌数组
//     private playerHealth = 5;        // 玩家生命值
//     private enemyHealth = 5;         // 敌人生命值
//     private currentRound = 1;        // 当前回合数
//     public  currentPhase:string;
//
//     // // 添加敌人卡牌初始化方法（需由后端调用）
//     // public initEnemyCards(cardsData: any[]) {
//     //     this.enemyCards = cardsData.map(data =>
//     //         Card.Create(this.deckManager.scene, data.presetKey)
//     //     );
//     //     // TODO: 将敌方卡牌放置到战场
//     // }
//
//     // 扩展阶段方法
//     private async playPhase() {
//         console.log("进入出牌阶段");
//         // 玩家出牌逻辑
//         await this.waitForPlayerActions();
//         this.currentPhase = 'damage';
//         this.nextPhase();
//     }
//
//     private async enemyPlayPhase() {
//         console.log("进入对方出牌阶段");
//         // 从后端获取敌方行动
//         const enemyActions = await this.fetchEnemyActions();
//         await this.executeEnemyActions(enemyActions);
//         this.currentPhase = 'enemyDamage';
//         this.nextPhase();
//     }
//
//     // 新增战斗核心方法
//     private async waitForPlayerActions(): Promise<void> {
//         return new Promise((resolve) => {
//             // 监听卡牌放置事件
//             const handler = () => {
//                 DeckManager.placedClawMarks.clear();
//                 resolve();
//             };
//             DeckManager.cardForPlaceTransformNode.onDisposeObservable.addOnce(handler);
//         });
//     }
//
//     private async fetchEnemyActions(): Promise<any> {
//         // TODO: 对接后端获取敌人行动
//         return new Promise(resolve => setTimeout(() =>
//             resolve({ actions: [] }), 1000
//         ));
//     }
//
//     private async executeEnemyActions(actions: any): Promise<void> {
//         // 执行敌人行动（示例）
//         actions.forEach(action => {
//             const enemyCard = this.enemyCards[action.cardIndex];
//             // TODO: 执行攻击/技能逻辑
//         });
//     }
//
//     // 扩展伤害结算
//     private damagePhase() {
//         console.log("进入伤害结算阶段");
//         this.resolveCombat();
//         this.currentPhase = 'enemyPlay';
//         this.nextPhase();
//     }
//
//     private resolveCombat() {
//         // 示例：简单伤害计算
//         const playerDamage = this.calculatePlayerDamage();
//         const enemyDamage = this.calculateEnemyDamage();
//
//         this.enemyHealth -= playerDamage;
//         this.playerHealth -= enemyDamage;
//
//         console.log(`本轮伤害：玩家造成 ${playerDamage}，敌方造成 ${enemyDamage}`);
//         this.checkGameOver();
//     }
//
//     private calculatePlayerDamage(): number {
//         // TODO: 实现实际伤害计算
//         return DeckManager.placedClawMarks.size;
//     }
//
//     private calculateEnemyDamage(): number {
//         // TODO: 实现实际伤害计算
//         return this.enemyCards.length;
//     }
//
//     private checkGameOver() {
//         if (this.playerHealth <= 0) {
//             console.log("游戏结束 - 玩家失败");
//             // TODO: 触发游戏结束流程
//         } else if (this.enemyHealth <= 0) {
//             console.log("游戏结束 - 玩家胜利");
//             // TODO: 触发胜利流程
//         }
//     }
//
//     // 新增回合控制
//     public startBattle() {
//         console.log(`第 ${this.currentRound} 回合开始`);
//         this.nextPhase();
//     }
//
//     public endRound() {
//         this.currentRound++;
//         console.log(`第 ${this.currentRound} 回合开始`);
//         this.nextPhase();
//     }
// }
//
// // 类型声明扩展（新建 BattleTypes.ts）
// export interface BattleAction {
//     type: 'ATTACK' | 'ABILITY';
//     cardIndex: number;
//     targetIndex?: number;
//     abilityType?: string;
// }