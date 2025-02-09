import type {Card} from "./Card.ts";

//卡牌种族

export enum CardTribe {
    //无种族
    NULL = 'NULL',
    //松鼠
    SQUIRER = 'SQUIRER',
    //鸟类
    AVIAN = 'AVIAN',
    //兽类
    CANINE = 'canine',
    //鹿
    HOOVED = 'HOOVED',
    //昆虫
    INSECT = 'INSECT',
    //爬行类
    REPTILE = 'REPTILE',
}
//卡牌稀有度
export enum CardRarity {
    //普通
    COMMON = 'COMMON',
    //稀有
    RARE = 'RARE',
}
// 卡牌的属性
export interface CardData {
    name: string;
    attack: string;
    hp: string;
    cost: CardCost;  // 限制cost只能是这四个值
    portraitUrl: string;
    initSigilNum?: number;
    sigilsArr?: Array<Sigil>;
    tribe?: CardTribe;
    rarity?: CardRarity;
}

// 定义Cost类型
export type CardCost = '0' | '1' | '2' | '3' | '4';

export type Sigil = {name: string, description: string, addFun: (card: Card) => void}
