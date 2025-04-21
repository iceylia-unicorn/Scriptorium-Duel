import {
    ActionManager,
    AssetContainer,
    ExecuteCodeAction,
    LoadAssetContainerAsync,
    Quaternion,
    Vector3
} from "@babylonjs/core";
import {globalBabylon} from "./globals.ts";
import message from "../utils/message.ts";
import {TableManager} from "./TableManager.ts";
import {DeckManager} from "./DeckManager.ts";
import {showGUIText} from "./GUIMessageSystem.ts";
import {eventEmitter, sendCardPlacement} from "../api/socket.ts";
import {gameState} from "./gameState.ts";
import {
    ability_evolve_1,
    ability_flying,
    ability_reach,
    ability_submerge,
    ability_tristrike,
    CARD_NAMES
} from "./Card-database.ts";
import {Card} from "./Card.ts";
import {CardTribe} from "./Card-types.ts";
import {v4 as uuid} from 'uuid';

//todo 对于不同阶段的错误操作其实应该只有一个
// 1. 抽卡时多抽 -> 每回合只能抽一张卡，不要贪心
// 2. 非自己回合抽卡 -> 请先等待对手出牌
// 3. 出牌环节想要抽卡，同1 -> 每回合只能抽一张卡，不要贪心
// 4. 没有抽卡就想要出牌 -> 请先抽卡
// 5. 非自己回合抽卡 -> 请先等待对手出牌
// 6. 非自己回合按铃铛 -> 现在还不是你的回合
// 7. 抽卡阶段按铃铛 -> 请先抽卡
// 总结 自己回合 非抽卡想要抽卡
//  自己回合 没抽卡就想要操作
// 在对面回合想要操作

export class BattleManager {
    private static instance: BattleManager;//单例
    public turnOverAnimation;
    private isEnabled = true; //是否启用
    // private bellContainer:AssetContainer;
    private bellRootNode;
    private bellMesh;
    private isMyturn = true;
    private lastGUITextTime = 0; // 新增时间戳记录 gui防止抖动
    public phase = "pending";
    private turnCount = 1; //回合数。
    private battleHPScreenNode;
    private battleHPScreenContainer: AssetContainer;
    // 初始血量
    private screenHP = 5;

    /**
     * 将实例置为null
     */
    public static reset() {
        if (BattleManager.instance) {

            BattleManager.instance = null!;
        }
    }

    public getEnabled() {
        return this.isEnabled;
    }

    // 单例模式获取唯一实例
    public static async getInstance(): Promise<BattleManager> {
        if (!BattleManager.instance) {
            // 确保已初始化
            if (!globalBabylon.scene || !globalBabylon.canvas) {
                throw new Error("BattleManager 必须在场景初始化后使用！");
            }
            // 异步构造，先运行异步，再返回构造。
            const bellContainer = await LoadAssetContainerAsync("models/bell9.glb", globalBabylon.scene!);
            const battleHPScreenContainer = await LoadAssetContainerAsync("models/screen7.glb", globalBabylon.scene!);

            BattleManager.instance = new BattleManager(bellContainer, battleHPScreenContainer);

        }


        return BattleManager.instance;
    }

    // 对战开始前
    public async pendingPhase() {
        this.phase = "pending";
        this.turnCount = 1;
        this.screenHP = 5;
        if (gameState.selfHP < gameState.opponentHP) {
            this.isMyturn = true;
        } else if (gameState.selfHP > gameState.opponentHP) {
            this.isMyturn = false;
        } else {
            this.isMyturn = !gameState.isOwner;
        }
        // console.log(this.isMyturn);
        //抽三张卡
        DeckManager.drawCreatureCards(3);
        setTimeout(() => {
            DeckManager.drawSquirrelCards(1);
            setTimeout(async () => {
                await this.nextPhase();
            }, DeckManager.drawCardsInterval + 1000);
        }, 3 * DeckManager.drawCardsInterval + 1000);
    }
    // 新回合初始化
    private async initPhase() {
        this.phase = "init";
        console.log(`第${this.turnCount}回合，现在是我的回合吗${this.isMyturn}`);
        /**
         * 当进入下一回合时放置区卡牌进行相应变化，比如卡牌进化
         * @param card 需要变化的卡牌
         * @param index 卡牌对应放置位置
         */
        const nextTurnFun = (card:Card,index:number) =>{
            card.placedTurnCount++;
            if(card.sigilsArr.has(ability_evolve_1)){
                //todo设计转换动画
                if(card.evolvedCard.length > 0) {
                    DeckManager.discardPile.push(card);
                    card.hide();
                    const newCard = Card.Create(globalBabylon.scene!, card.evolvedCard);
                    DeckManager.getSquirrelInstance().placeClawMark(newCard,index);
                }
            }
        }
        if(this.isMyturn) {
            //init2 init2->draw->play->myClick->resolve1->turn-> init1->opClick->resolve2->turn->init2
            // 敌方 pending->init1->opClick->resolve2->turn->init2
            DeckManager.placedCards.forEach((card,index) => {
                if(index<4 && card){
                    nextTurnFun(card,index);
                }
            })
            showGUIText("现在是你的回合")
            await this.nextPhase();
        }
        else{
            //init1
            DeckManager.placedCards.forEach((card,index) => {
                if(index>=4 && card){
                    nextTurnFun(card,index);
                }
            })
        }
    }

    // 抽取卡牌阶段
    private async drawCardPhase() {
        // CameraManager.getInstance().switchViewStatus(VIEWSTATUS.deck);
        this.phase = "draw";
        const _turnCount = this.turnCount;
        DeckManager.drawPhaseCount = gameState.drawPhaseCount;
        console.log("drawPhase");
        // 新增：监听抽卡完成事件
        const drawCompleteHandler = async () => {
            if (this.phase === "draw" && this.turnCount === _turnCount) {
                await this.nextPhase();
            }
        };
        eventEmitter.on('drawCardsCompleted', drawCompleteHandler);
        setTimeout(async () => {
            //说明30秒后都没有抽完，直接强制下一回合
            if (this.phase === "draw" && this.turnCount === _turnCount) {
                DeckManager.drawCreatureCards(DeckManager.drawPhaseCount);
                DeckManager.drawPhaseCount = 0;
                await this.nextPhase();
            }
        }, 30 * 1000);

    }

    //
    private async playPhase() {
        this.phase = "play";
        console.log("playPhase");
        DeckManager.playStatus = true;

    }
    private async resolvePhase() {
        this.phase = "resolve";
        if(this.turnCount < 3){
            console.log("双方第一回合不攻击");
            await this.nextPhase();
            return;
        }
        /**
         * 通过攻击者和防守方绘制动画
         * @param attacker 攻击者
         * @param defender 防守方
         * @return 返回溢出伤害
         */
        const combatResolve = async (attacker:Card, defender:Card|null):Promise<{ alphaHP:number,attackerAlive:boolean,defenderAlive:boolean}>=>{
            let alphaHP = 0;
            let attackerAlive = true;
            let defenderAlive = true;
            if(!defender || defender.sigilsArr.has(ability_submerge)){
                alphaHP = attacker.attack;
            }
            //如果出现了飞行，并且还没有防御飞行的。
            else if(attacker.sigilsArr.has(ability_flying) && !defender.sigilsArr.has(ability_reach)){
                alphaHP = attacker.attack;
            }
            else{
                if(defender.hp <= attacker.attack){
                    //过量伤害，防御者死亡
                  alphaHP= attacker.attack- defender.hp;
                  defender.hp = 0;
                  defender.hide();
                  defenderAlive= false;
                  defender.resetAttribute();
                }
                else{
                    defender.hp -= attacker.attack;
                }
            }
            return new Promise(resolve => resolve({alphaHP, attackerAlive, defenderAlive}));
            // 对手是否能被打到
            // attacker
        }
        const resolveCombat = async (attackerIndices: number[], defenderOffset: number) => {

            for (const index of attackerIndices) {
                const attacker = DeckManager.placedCards[index];
                if(!attacker) continue;
                // 刚下的卡牌不能攻击
                // if (!attacker||!attacker.placedTurnCount) continue;

                //对面卡牌地址
                const opponentIndex = index + defenderOffset;
                if (attacker.sigilsArr.has(ability_tristrike)) { //有三重打击时候
                    for (let i = Math.max(attackerIndices[0]+defenderOffset, opponentIndex - 1); i <= attackerIndices[3] + defenderOffset; i++) {
                        if (i > opponentIndex + 1) break;
                        const defender =DeckManager.placedCards[i];
                        const {alphaHP,attackerAlive,defenderAlive} = await combatResolve(attacker,defender);
                        this.screenHP += this.isMyturn ? alphaHP : -alphaHP;
                        this.setBattleScreenHP(this.screenHP);
                        if(!attackerAlive){
                            attacker.hide();
                            DeckManager.placedCards[index] = null;
                            DeckManager.discardPile.push(attacker);
                        }
                        if(!defenderAlive&&defender){
                            defender.hide();
                            DeckManager.placedCards[i] = null;
                            DeckManager.discardPile.push(defender);
                        }
                    }
                }
                else{
                    const defender =DeckManager.placedCards[opponentIndex];
                    const {alphaHP,attackerAlive,defenderAlive} = await combatResolve(attacker, defender);
                    this.screenHP += this.isMyturn ? alphaHP : -alphaHP;
                    this.setBattleScreenHP(this.screenHP);
                    if(!attackerAlive){
                        attacker.hide();
                        DeckManager.placedCards[index] = null;
                        DeckManager.discardPile.push(attacker);
                    }
                    if(!defenderAlive&&defender){
                        defender.hide();
                        DeckManager.placedCards[opponentIndex] = null;
                        DeckManager.discardPile.push(defender);
                    }
                }
            }
            // 血量边界检查
            this.screenHP = Math.max(0, Math.min(10, this.screenHP));
            this.setBattleScreenHP(this.screenHP);

            if (this.screenHP === 10) showGUIText("你赢了");
            if (this.screenHP === 0) showGUIText("你输了");
        };

        // 根据回合执行不同方向的攻击
        if (this.isMyturn) {
            //resovle1
            await resolveCombat([0, 1, 2, 3], 4); // 己方攻击右侧
        } else {
            //resolve2
            await resolveCombat([4, 5, 6, 7], -4); // 敌方攻击左侧
        }

        await this.nextPhase(); // 确保无论如何都进入下一阶段
    }
    private async nextPhase() {
        switch (this.phase) {
            case "pending":
                await this.initPhase();
                break;
            case "init":
                await this.drawCardPhase();
                break;
            case "draw":
                await this.playPhase();
                break;
            case "play":
                DeckManager.playStatus = false;
                await this.resolvePhase();
                break;
            case "resolve": //1.自己回合结束，2在initPhase等待时对方结束->resolve->initPhase
                this.isMyturn = !this.isMyturn; // 直接切换回合归属
                console.log("isMyturn被切换为"+this.isMyturn);
                this.turnCount++;
                await this.initPhase(); // 无论谁的回合都重新初始化
                break;
        }
    }

    /**
     * 设置战斗屏幕血量
     * @param value 血量
     * @private
     */
    private setBattleScreenHP(value: number) {
        for (let i = 1; i <= value; i++) {
            this.battleHPScreenContainer.meshes[i].material = this.battleHPScreenContainer.materials[1];
        }
        for (let i = value + 1; i <= 10; i++) {
            this.battleHPScreenContainer.meshes[i].material = this.battleHPScreenContainer.materials[2];
        }
    }

    private constructor(bellContainer: AssetContainer, battleHPScreenContainer: AssetContainer) {
        this.turnOverAnimation = bellContainer.animationGroups[0];
        this.turnOverAnimation.stop();

        this.battleHPScreenContainer = battleHPScreenContainer;

        battleHPScreenContainer.addAllToScene();
        bellContainer.addAllToScene();

        //control model through root node.
        this.bellRootNode = bellContainer.meshes[0]; //meshes的第一个为__root__为了兼容glb模型与bjs的不同，比如坐标系就不一样。
        this.battleHPScreenNode = battleHPScreenContainer.meshes[0];

        this.bellRootNode.position = new Vector3(-12.424453735351562, 0.06219588592648506, -9.178736686706543)
        this.bellRootNode.scaling = new Vector3(1.5, 1.5, 1.5000000560643836);// (debugNode as BABYLON.Mesh)
        this.bellRootNode.rotationQuaternion = new Quaternion(0, 0.9924006069826459, 0.12304891409710288, 0);// (debugNode as BABYLON.Mesh)

        this.battleHPScreenNode.position = new Vector3(-12.583903312683105, -1.4776843786239624, -1.1896189451217651);// (debugNode as BABYLON.Mesh)
        this.battleHPScreenNode.scaling = new Vector3(1, 1, 1);// (debugNode as BABYLON.Mesh)

        this.battleHPScreenNode.rotationQuaternion = new Quaternion(0.7688511885787377, -0.13172556173132488, 0.615049394599091, -0.1150237732424084)

        //todo 如何获得container中的material
        console.log(battleHPScreenContainer.materials[1]); //blue-1 red-2;
        console.log(battleHPScreenContainer.meshes); // 1是第一个元素


        this.bellMesh = bellContainer.meshes[1];
        this.bellMesh.actionManager = new ActionManager(globalBabylon.scene);
        this.bellMesh.actionManager.registerAction(new ExecuteCodeAction(
            ActionManager.OnLeftPickTrigger,
            async () => {
                if (this.isMyturn) {
                    if (this.phase === "play") {
                        this.turnOverAnimation.play(false);

                        message.info("回合结束");

                        const placedCards = DeckManager.placedCards.map((item, index) =>
                            item ? {positionIndex: index, cardId: item.id, presetKey:item.presetKey} : null)
                            .filter(item => item !== null)
                        sendCardPlacement(placedCards);

                        await this.nextPhase();
                    } else {
                        showGUIText("请先抽卡");
                    }
                } else {
                    const now = Date.now();
                    if (now - this.lastGUITextTime > 2000) {
                        showGUIText("现在是对方回合");
                        this.lastGUITextTime = now;
                    }
                }
            })
        )
        // hide battle scene in default.
        this.setEnabled(false);
        // init listener
        eventEmitter.on("receiveOpponentTurnOver", async (data: any) => {
                data.cards.forEach((placement: { cardId: string, positionIndex: number,presetKey:string }) => {
                    placement.positionIndex += 4;
                    // 找到对应的地方卡牌
                    let card = DeckManager.opponentCards.find(c => c.id === placement.cardId);
                    // 找不到就说明是松鼠牌或者是衍生牌或者是进化牌。
                    if (!card && placement.presetKey == CARD_NAMES.Squirrel) {
                        card = DeckManager.opponentCards.find(c => c.tribe === CardTribe.SQUIRREL);
                    }
                    else{
                        card = DeckManager.getSpawnedCard(placement.presetKey);
                    }
                    DeckManager.placedCards[placement.positionIndex]?.hide();
                    if (!card) {
                        card = Card.Create(globalBabylon.scene!, CARD_NAMES.Squirrel, uuid());
                    }
                    DeckManager.getSquirrelInstance().placeClawMark(card,placement.positionIndex);
                    DeckManager.opponentCards.push(card);
                    DeckManager.placedCards[placement.positionIndex] = card;

                });
                await this.resolvePhase();
            }
        )
    }
    /**
     * 设置战斗场景是否启用
     */
    public setEnabled(isEnable: boolean): void {
        if (this.isEnabled === isEnable)
            return;
        this.isEnabled = isEnable;

        if (isEnable) {
            //启用战斗场景
            this.bellMesh.setEnabled(true);
            TableManager.getInstance().setBattleFiledEnabled(true);
            DeckManager.getCreatureInstance().setEnabled(true);
            DeckManager.getSquirrelInstance().setEnabled(true);

        } else {
            this.bellMesh.setEnabled(false);
            TableManager.getInstance().setBattleFiledEnabled(false);
            DeckManager.getCreatureInstance().setEnabled(false);
            DeckManager.getSquirrelInstance().setEnabled(false);

        }
    }

}