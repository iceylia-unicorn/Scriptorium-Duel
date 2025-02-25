import {CARD_NAMES} from "./Card-database.ts";
import {v4 as uuid} from "uuid";
import {reactive} from "vue";

// 定义非响应式属性
const nonReactiveProperties = {
    roomid: null,
};
export const gameState = reactive({
    hp:100,
    selfInitDeck: [
        {
            name: CARD_NAMES.Wolf,
            id: uuid()
        },
        {
            name: CARD_NAMES.Bullfrog,
            id: uuid()
        },
        {
            name: CARD_NAMES.Bullfrog,
            id: uuid()
        }
    ],
    roomid: null,
    players: [],
})

Object.assign(gameState, nonReactiveProperties);