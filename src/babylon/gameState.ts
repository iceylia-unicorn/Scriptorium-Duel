import {CARD_NAMES} from "./Card-database.ts";
import {v4 as uuid} from "uuid";
import {reactive} from "vue";


export const gameState = reactive({
    selfHP: 100,
    opponentHP: 100,
    selfInitDeck: [
        {
            name: CARD_NAMES.Wolf,
            id: uuid(),
        },
        {
            name: CARD_NAMES.Bullfrog,
            id: uuid(),
        },
        {
            name: CARD_NAMES.wolfCub,
            id: uuid(),
        },
        {
            name: CARD_NAMES.beehive,
            id: uuid()
        },
        {
            name: CARD_NAMES.Bullfrog,
            id: uuid(),
        },
        {
            name: CARD_NAMES.wolfCub,
            id: uuid(),
        },
        {
            name: CARD_NAMES.beehive,
            id: uuid()
        }
    ],
    opponentDeck: [],
    roomID: "",
    golds:10,
    players: [],
    isOwner: false,
    drawPhaseCount: 1,//每回合抽卡数
    // status: "pending",
})

