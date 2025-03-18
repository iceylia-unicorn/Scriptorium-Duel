import {CARD_NAMES} from "./Card-database.ts";
import {v4 as uuid} from "uuid";
import {reactive} from "vue";



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
    roomid: "",
    players: [],
})

