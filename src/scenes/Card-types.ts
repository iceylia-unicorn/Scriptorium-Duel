import type {Card} from "./Card.ts";

//卡牌种族

export enum CardTribe {
    //卡牌种族
    NULL = '无',
    //松鼠
    SQUIRER = '松鼠',
    //鸟类
    AVIAN = '鸟',
    //兽类
    CANINE = '兽',
    //鹿
    HOOVED = '鹿',
    //昆虫
    INSECT = '昆虫',
    //爬行类
    REPTILE = '爬行',
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
