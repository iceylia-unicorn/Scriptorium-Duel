import {type CardData, CardRarity, CardTribe} from "./Card-types.ts";
import {staticUrl} from "../api";
import type {Card} from "./Card.ts";

export enum CARD_NAMES {
    //松鼠
    Squirrel = 'SQUIRREL',
    Wolf = "WOLF", //狼
    // River_Snapper = "RIVER_SNAPPER",
    Bat = "BAT",
    Bullfrog = "BULLFROG", //牛蛙


}

export const PRESET_CARDS: { [key: string]: CardData } = {
    SQUIRREL: {
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
    WOLF: {
        name: "狼",
        attack: "3",
        hp: "1",
        cost: "2",
        portraitUrl: `${staticUrl}images/cards/portraits/portrait_wolf.png`,
        tribe: CardTribe.CANINE,
        rarity: CardRarity.COMMON
    },
    // RIVER_SNAPPER:{
    //     name: "狼",
    //     attack: "1",
    //     hp: "6",
    //     cost: "2",
    //     portraitUrl: `${staticUrl}images/cards/portraits/wolf.png`,
    //     tribe: CardTribe.REPTILE,
    //     rarity: CardRarity.COMMON
    // },
    BAT:{
        name: "蝙蝠",
        attack: "2",
        hp: "1",
        cost: "2",
        portraitUrl: `${staticUrl}images/cards/portraits/portrait_wolf.png`,
        tribe: CardTribe.CANINE,
        rarity: CardRarity.COMMON
    },
    BULLFROG:{
        name: "牛蛙",
        attack: "1",
        hp: "2",
        cost: "1",
        portraitUrl: `${staticUrl}images/cards/portraits/portrait_wolf.png`,
        tribe: CardTribe.REPTILE,
        rarity: CardRarity.COMMON
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


//
export const ability_tristrike = {
    name: "Tristrike",
    description: "攻击时，会同时攻击三个方向。",
    addFun: (card: Card) => {
        // 添加功能
        card.strikeFuns.push(() => {
            console.log("此时攻击三个方向");
        });
        card.sigilsArr.push(ability_tristrike);
        // 添加图标
        card.drawSigil(staticUrl + "images/cards/sigils/ability_tristrike.png");

    }
}
export const ability_strafe = {
    name: "Tristrike",
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
