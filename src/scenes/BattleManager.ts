// import type {TableManager} from "./DeckManager.ts";

import type {DeckManager} from "./DeckManager.ts";

export class BattleManager {
    private currentPhase: 'draw' | 'play' | 'enemyPlay' | 'damage' | 'enemyDamage' = 'draw';
    private deckManager: DeckManager;

    constructor(deckManager: DeckManager) {
        this.deckManager = deckManager;
    }

    // 进入下一阶段
    nextPhase() {
        switch (this.currentPhase) {
            case 'draw':
                this.drawPhase();
                break;
            case 'play':
                this.playPhase();
                break;
            case 'enemyPlay':
                this.enemyPlayPhase();
                break;
            case 'damage':
                this.damagePhase();
                break;
            case 'enemyDamage':
                this.enemyDamagePhase();
                break;
        }
    }

    // 抽卡阶段
    private drawPhase() {
        console.log("进入抽卡阶段");
        this.deckManager.drawCardAnimation();
        this.currentPhase = 'play';
        // this.nextPhase();
    }

    // 出牌阶段
    private playPhase() {
        console.log("进入出牌阶段");
        // 在这里实现出牌逻辑
        this.currentPhase = 'damage';
    }

    // 对方出牌阶段
    private enemyPlayPhase() {
        console.log("进入对方出牌阶段");
        // 在这里实现对方出牌逻辑
        this.currentPhase = 'enemyDamage';
    }

    // 伤害结算阶段
    private damagePhase() {
        console.log("进入伤害结算阶段");
        // 在这里实现伤害结算逻辑
        this.currentPhase = 'enemyPlay';
    }

    // 对方伤害结算阶段
    private enemyDamagePhase() {
        console.log("进入对方伤害结算阶段");
        // 在这里实现对方伤害结算逻辑
        this.currentPhase = 'draw';
    }
}