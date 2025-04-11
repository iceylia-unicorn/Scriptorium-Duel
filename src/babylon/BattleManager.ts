import {
    ActionManager,
    AssetContainer,
    ExecuteCodeAction,
    LoadAssetContainerAsync,
    Mesh,
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
import {CARD_NAMES} from "./Card-database.ts";
import {Card} from "./Card.ts";
import {CameraManager, VIEWSTATUS} from "./CameraManager.ts";
import {CardTribe} from "./Card-types.ts";
import { v4 as uuid } from 'uuid';

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
    private isEnabled  = true; //是否启用
    // private bellContainer:AssetContainer;
    private bellRootNode;
    private bellMesh;
    private isMyturn = true;
    private lastGUITextTime = 0; // 新增时间戳记录 gui防止抖动
    public phase = "pending";
    private turnCount = 0; //回合数。

    /**
     * 将实例置为null
     */
    public static reset() {
        if (BattleManager.instance) {

            BattleManager.instance = null!;
        }
    }
    public getEnabled () {
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
            BattleManager.instance = new BattleManager(bellContainer)
        }


        return BattleManager.instance;
    }
    // 对战开始前
    public async pendingPhase(){
        this.phase = "pending";
        this.turnCount = 0;
        if(gameState.selfHP < gameState.opponentHP){
            this.isMyturn = true;
        }
        else if(gameState.selfHP > gameState.opponentHP){
            this.isMyturn = false;
        }
        else{
            this.isMyturn = !gameState.isOwner;
        }
        //抽三张卡
        DeckManager.drawCreatureCards(3);
        setTimeout(()=>{
            DeckManager.drawSquirrelCards(1);
            setTimeout(()=>{
                this.nextPhase();
            }, DeckManager.drawCardsInterval+1000);
        }, 3*DeckManager.drawCardsInterval+1000);
    }
    // 新回合初始化
    private initPhase(){
        this.phase = "init";
        this.nextPhase();
    }
    // 抽取卡牌阶段
    private drawCardPhase(){
        CameraManager.getInstance().switchViewStatus(VIEWSTATUS.deck);
        this.phase = "draw";
        const _turnCount = this.turnCount;
        DeckManager.drawPhaseCount = gameState.drawPhaseCount;
        // 新增：监听抽卡完成事件
        const drawCompleteHandler = () => {
            if (this.phase === "draw" && this.turnCount === _turnCount) {
                this.nextPhase();
            }
        };
        eventEmitter.once('drawCardsCompleted', drawCompleteHandler);
        setTimeout(()=>{
            //说明10秒后都没有抽完，直接强制下一回合
           if(this.phase === "draw" && this.turnCount === _turnCount){
               DeckManager.drawPhaseCount = 0;
               DeckManager.drawCreatureCards(DeckManager.drawPhaseCount);
           }
        },10*1000);

    }
    //
    private playPhase(){
        this.phase = "play";
        DeckManager.playStatus = true;

    }
    //todo 添加对方回合结束的循环
    // todo 添加结算环节。

    private nextPhase(){
        //
        if(this.phase === "pending"){
            this.initPhase();
        }
        else if(this.phase === "init"){
            this.drawCardPhase();
        }
        else if(this.phase === "draw"){
            this.playPhase();
        }
        else if(this.phase === "play"){
            DeckManager.playStatus = false;
            //下一回合处理。
            this.isMyturn = false;
            this.turnCount++;
        }
        // else if(this.phase = "play")
    }

    private constructor(bellContainer: AssetContainer) {
        // this.bellContainer = bellContainer;
        this.turnOverAnimation = bellContainer.animationGroups[0];
        this.turnOverAnimation.stop();

        bellContainer.addAllToScene();

        //control model through root node.
        this.bellRootNode = bellContainer.meshes[0]; //meshes的第一个为__root__为了兼容glb模型与bjs的不同，比如坐标系就不一样。
        this.bellRootNode.position = new Vector3(-12.424453735351562, 0.06219588592648506, -9.178736686706543)
        this.bellRootNode.scaling = new Vector3(1.5, 1.5, 1.5000000560643836);// (debugNode as BABYLON.Mesh)
        this.bellRootNode.rotationQuaternion = new Quaternion(0, 0.9924006069826459, 0.12304891409710288, 0);// (debugNode as BABYLON.Mesh)

        this.bellMesh = bellContainer.meshes[1];
        this.bellMesh.actionManager = new ActionManager(globalBabylon.scene);
        this.bellMesh.actionManager.registerAction( new ExecuteCodeAction(
            ActionManager.OnLeftPickTrigger,
            () => {
                if(this.isMyturn){
                    if(this.phase === "play"){
                        this.turnOverAnimation.play(false);

                        message.info("回合结束");
                        const placedCards = Array.from(DeckManager.placedClawMarks).map(mark => ({
                            positionIndex: mark[0],
                            cardId: mark[1]

                        }));
                        sendCardPlacement(placedCards);
                        console.log(gameState.roomID);
                        //todo 将isMyturn放入nextPhase中
                        this.nextPhase();
                    }
                    else{
                        showGUIText("请先抽卡");
                    }

                }
                else {
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
        eventEmitter.on("receiveOpponentTurnOver", (data:any) => {
            //需要清除之前放置的东西
            const clawMarks = globalBabylon.scene!.getTransformNodeByName("clawTransformNode")?.getChildren();
            if(!clawMarks){
                throw new Error("clawMarks在未被初始化之前调用");
            }

            data.cards.forEach((placement: {cardId: string, positionIndex: number}) => {
                placement.positionIndex += 4;
                // 找到对应的地方卡牌
                let card = DeckManager.opponentCards.find(c => c.id === placement.cardId);
                // 找不到就说明是松鼠牌。
                if(!card){
                    card = DeckManager.opponentCards.find(c =>c.tribe  === CardTribe.SQUIRREL);
                }
                const clawMask = clawMarks[placement.positionIndex];
                if (card) {
                    if (clawMask instanceof Mesh) {
                        card.show(clawMask, Vector3.Zero(), Vector3.Zero());
                        DeckManager.placedClawMarks.set(placement.positionIndex, placement.cardId);
                    }
                }
                else{
                    if (clawMask instanceof Mesh) {
                        const newSquirrel = Card.Create(globalBabylon.scene!, CARD_NAMES.Squirrel, uuid());
                        newSquirrel.show(clawMask, Vector3.Zero(), Vector3.Zero());
                        DeckManager.opponentCards.push(newSquirrel);
                    }
                }
            });
            this.isMyturn = true;
        })
    }

    /**
     * 设置战斗场景是否启用
     */
    public setEnabled(isEnable:boolean): void {
        if(this.isEnabled === isEnable) return;
        this.isEnabled  = isEnable;

        if(isEnable){
            //启用战斗场景
            this.bellMesh.setEnabled(true);
            TableManager.getInstance().setBattleFiledEnabled(true);
            DeckManager.getCreatureInstance().setEnabled(true);
            DeckManager.getSquirrelInstance().setEnabled(true);

        }
        else{
            this.bellMesh.setEnabled(false);
            TableManager.getInstance().setBattleFiledEnabled(false);
            DeckManager.getCreatureInstance().setEnabled(false);
            DeckManager.getSquirrelInstance().setEnabled(false);

        }
    }

}