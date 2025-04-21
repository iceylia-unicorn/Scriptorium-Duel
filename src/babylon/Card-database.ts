import {type CardData, CardRarity, CardTribe} from "./Card-types.ts";
import {staticUrl} from "../api";
import {Card} from "./Card.ts";
import {DeckManager} from "./DeckManager.ts";
import {globalBabylon} from "./globals.ts";


export enum CARD_NAMES {
    /** 松鼠 */
    Squirrel = 'SQUIRREL',
    /** 狼 */
    Wolf = "WOLF",
    // River_Snapper = "RIVER_SNAPPER",
    /**蝙蝠*/
    Bat = "BAT",
    /** 牛蛙*/
    Bullfrog = "BULLFROG", //牛蛙
    /**翠鸟*/
    Kingfisher = "KINGFISHER",
    /**螳螂神*/
    mantisGod = "MANTISGOD",
    /**渡鸦蛋*/
    ravenEgg = "RAVENEGG",
    /**渡鸦*/
    raven = "RAVEN",
    /**麻雀*/
    sparrow = "SPARROW",
    /**幼狼*/
    wolfCub = "WOLFCUB",
    /**猎犬**/
    bloodhound = "BLOODHOUND",
    /**13号孩子**/
    jerseyDevilSleeping = "JERSEY_SLEEPING",
    /**13号孩子**/
    jerseyDevil = "JERSEY",

}


//
export const ability_tristrike = {
    name: "Tristrike",
    description: "攻击时，会同时攻击三个方向。",
    addFun: (card: Card) => {
        // 添加功能
        card.strikeFuns.push(() => {
            console.log("此时攻击三个方向");
        });
        card.sigilsArr.add(ability_tristrike);
        // 添加图标
        card.drawSigil(staticUrl + "images/cards/sigils/ability_tristrike.png");

    }
}
export const ability_strafe = {
    name: "strafe",
    description: "攻击后按指定方向移动。",
    addFun: (card: Card) => {
        // 添加图标
        card.drawSigil(staticUrl + "images/cards/sigils/ability_strafe.png");
        // 添加功能
        card.strikeFuns.push(() => {
            console.log("此时攻击三个方向");
        });
    }
}
export const ability_submerge = {
    name: "Waterborne",
    description: "水生生物，在敌方回合将无法被击中",
    addFun: (card: Card) => {
        card.drawSigil(staticUrl + "images/cards/sigils/ability_submerge.png");
        card.sigilsArr.add(ability_submerge);
    }
}
export const ability_flying = {
    name: "flying",
    description: "飞行",
    addFun: (card: Card) => {
        card.drawSigil(staticUrl + "images/cards/sigils/ability_flying.png");
        card.sigilsArr.add(ability_flying);
    }
}
export const ability_reach = {
    name: "reach",
    description: "可以防住飞行单位攻击",
    addFun: (card: Card) => {
        card.drawSigil(staticUrl + "images/cards/sigils/ability_reach.png");
        card.sigilsArr.add(ability_reach);
    }
}
export const ability_evolve_1 = {
    name: "evolve_1",
    description: "在上场一回合后，对于某些卡会产生较大的变化，对于大部分的卡，都只会增加1攻2血",
    addFun: (card: Card) => {
        card.drawSigil(staticUrl + "images/cards/sigils/ability_evolve_1.png");
        card.sigilsArr.add(ability_evolve_1);
    }
}
export const ability_guarddog = {
    name: "guarddog",
    description: "当对方放置卡牌且对位有空位时，卡牌将移动到那个空位进行守卫",
    addFun: (card: Card) => {
        card.drawSigil(staticUrl + "images/cards/sigils/ability_guarddog.png");
        card.sigilsArr.add(ability_guarddog);
    }
}
export const ability_sacrificial = {
    name: "sacrificial",
    description: "被献祭时不会死亡",
    addFun: (card: Card) => {
        card.drawSigil(staticUrl + "images/cards/sigils/ability_sacrificial.png");
        card.sigilsArr.add(ability_sacrificial);
        card.onSacrificeFuns[0] = ()=>{
            DeckManager.currentSacrificeCount++;
        }
    }
}


export const PRESET_CARDS: { [key: string]: CardData } = {
    [CARD_NAMES.Squirrel]: {
        name: "松鼠",
        attack: "0",
        hp: "1",
        cost: "0",
        portraitUrl: `${staticUrl}images/cards/portraits/portrait_squirrel.png`,

        tribe: CardTribe.NULL,
        rarity: CardRarity.COMMON
    },
    STOAT: {
        name: "白鼬",
        attack: "1",
        hp: "1",
        cost: "1",
        portraitUrl: `${staticUrl}images/cards/portraits/talkingCards/stoat_character_body.png`,
        tribe: CardTribe.NULL,
        rarity: CardRarity.COMMON
    },
    [CARD_NAMES.Wolf]: {
        name: "狼",
        attack: "3",
        hp: "1",
        cost: "2",
        portraitUrl: `${staticUrl}images/cards/portraits/portrait_wolf.png`,
        tribe: CardTribe.CANINE,
        rarity: CardRarity.COMMON
    },
    [CARD_NAMES.Bat]: {
        name: "蝙蝠",
        attack: "2",
        hp: "1",
        cost: "2",
        portraitUrl: `${staticUrl}images/cards/portraits/portrait_wolf.png`,
        tribe: CardTribe.CANINE,
        rarity: CardRarity.COMMON,

    },
    [CARD_NAMES.Bullfrog]: {
        name: "牛蛙",
        attack: "1",
        hp: "2",
        cost: "1",
        portraitUrl: `${staticUrl}images/cards/portraits/portrait_bullfrog.png`,
        tribe: CardTribe.REPTILE,
        rarity: CardRarity.COMMON,
        sigilsArr: [ability_reach],
    },
    [CARD_NAMES.Kingfisher]: {
        name: "翠鸟",
        attack: "1",
        hp: "1",
        cost: "1",
        portraitUrl: `${staticUrl}images/cards/portraits/portrait_kingfisher.png`,
        tribe: CardTribe.AVIAN,
        rarity: CardRarity.COMMON,
        sigilsArr: [ability_submerge, ability_flying]
    },
    [CARD_NAMES.mantisGod]: {
        name: "螳螂神",
        attack: "1",
        hp: "1",
        cost: "1",
        portraitUrl: `${staticUrl}images/cards/portraits/portrait_mantisgod.png`,
        tribe: CardTribe.INSECT,
        rarity: CardRarity.RARE,
        sigilsArr: [ability_tristrike]
    },
    [CARD_NAMES.ravenEgg]:{
        name:"渡鸦蛋",
        attack: "0",
        hp:"2",
        cost: "1",
        portraitUrl: `${staticUrl}images/cards/portraits/portrait_ravenegg.png`,
        tribe: CardTribe.AVIAN,
        rarity: CardRarity.COMMON,
        sigilsArr: [ability_evolve_1],
        evolvedCard: CARD_NAMES.raven
    },
    [CARD_NAMES.raven]:{
        name: "渡鸦",
        attack: "2",
        hp: "3",
        cost : "2",
        portraitUrl: `${staticUrl}images/cards/portraits/portrait_raven.png`,
        tribe: CardTribe.AVIAN,
        rarity: CardRarity.COMMON,
        sigilsArr: [ability_flying]
    },
    [CARD_NAMES.sparrow]:{
        name: "麻雀",
        attack: "1",
        hp: "2",
        cost : "1",
        portraitUrl: `${staticUrl}images/cards/portraits/portrait_sparrow.png`,
        tribe: CardTribe.AVIAN,
        rarity: CardRarity.COMMON,
        sigilsArr: [ability_flying]
    },
    [CARD_NAMES.wolfCub]:{
        name: "幼狼",
        attack: "1",
        hp: "1",
        cost: "1",
        portraitUrl:`${staticUrl}images/cards/portraits/portrait_wolfcub.png`,
        tribe: CardTribe.CANINE,
        rarity:CardRarity.COMMON,
        sigilsArr: [ability_evolve_1],
        evolvedCard: CARD_NAMES.Wolf
    },
    [CARD_NAMES.bloodhound]:{
        name: "猎犬",
        attack: "2",
        hp: "3",
        cost: "2",
        portraitUrl:`${staticUrl}images/cards/portraits/portrait_bloodhound.png`,
        tribe: CardTribe.CANINE,
        rarity:CardRarity.COMMON,
        sigilsArr: [ability_guarddog]
    },
    [CARD_NAMES.jerseyDevilSleeping]:{
        name:"13号孩子",
        attack: "0",
        hp: "1",
        cost: "1",
        portraitUrl: `${staticUrl}images/cards/portraits/portrait_jerseydevil_sleeping.png`,
        tribe: CardTribe.HOOVED,
        rarity: CardRarity.RARE,
        sigilsArr: [ability_sacrificial],
        isSpawned:true,
        onCreate: (card)=>{
            card.onSacrificeFuns.push(()=>{
                const index = DeckManager.getPlacedCardIndex(card);
                if(!DeckManager.tempPlacedCards[index]){
                    DeckManager.tempPlacedCards[index] = DeckManager.getSpawnedCard(CARD_NAMES.jerseyDevil);
                    DeckManager.getSquirrelInstance().addClawActionTrigger(DeckManager.tempPlacedCards[index]);
                }
                let temp = DeckManager.tempPlacedCards[index];
                if(index == -1) return;

                DeckManager.tempPlacedCards[index] = DeckManager.placedCards[index];
                DeckManager.tempPlacedCards[index]!.hide();
                DeckManager.getSquirrelInstance().placeClawMark(temp, index);
            })
            //todo 需要将衍生卡牌进行回收，并且这张13号孩子的回收工作应该会与众不同

        }
    },
    [CARD_NAMES.jerseyDevil]:{
        name:"13号孩子",
        attack: "2",
        hp: "1",
        cost: "1",
        portraitUrl: `${staticUrl}images/cards/portraits/portrait_jerseydevil.png`,
        tribe: CardTribe.HOOVED,
        rarity: CardRarity.RARE,
        sigilsArr: [ability_sacrificial, ability_flying],
        onCreate: (card)=>{
            card.onSacrificeFuns.push(()=>{
                const index = DeckManager.getPlacedCardIndex(card);
                if(!DeckManager.tempPlacedCards[index]){
                    DeckManager.tempPlacedCards[index] = Card.Create(globalBabylon.scene!, CARD_NAMES.jerseyDevil);
                    DeckManager.getSquirrelInstance().addClawActionTrigger(DeckManager.tempPlacedCards[index]);

                }
                let temp = DeckManager.tempPlacedCards[index];
                if(index == -1) return;
                console.log(card);

                DeckManager.tempPlacedCards[index] = DeckManager.placedCards[index];
                DeckManager.tempPlacedCards[index]!.hide();
                DeckManager.getSquirrelInstance().placeClawMark(temp, index);

            })
        }
    }
}
// 卡牌分类索引
export const CARD_INDICES = {
    byCost: {
        '0': [] as string[],
        '1': [] as string[],
        '2': [] as string[],
        '3': [] as string[],
        '4': [] as string[],
    },
    byTribe: {} as { [key in CardTribe]: string[] },
    byRarity: {} as { [key in CardRarity]: string[] }
};
// 遍历所有卡牌 初始化卡牌索引
Object.entries(PRESET_CARDS).forEach(([cardKey, cardData]) => {
    // 添加到cost索引
    CARD_INDICES.byCost[cardData.cost].push(cardKey);
    if (cardData.tribe) {
        CARD_INDICES.byTribe[cardData.tribe] = CARD_INDICES.byTribe[cardData.tribe] || [];
        CARD_INDICES.byTribe[cardData.tribe].push(cardKey);
    }
    if (cardData.rarity) {
        CARD_INDICES.byRarity[cardData.rarity] = CARD_INDICES.byRarity[cardData.rarity] || [];
        CARD_INDICES.byRarity[cardData.rarity].push(cardKey);
    }
});


// 异步加载图像，返回promise对象
export function loadImage(src: string) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            resolve(img);
        };
        img.onerror = reject;  // 图像加载失败
        img.src = src;
    })
}


