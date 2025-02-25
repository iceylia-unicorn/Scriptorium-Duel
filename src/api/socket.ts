import {io, Socket} from 'socket.io-client';
import {socketUrl} from "./index.ts";
import type {CARD_NAMES} from "../scenes/Card-database.ts";
import {gameState} from "../scenes/gameState.ts";
// socket.ts
let socketInstance: Socket | null = null;

// 在每次使用socket实例前调用以确保有socket实例。
export function getSocket() {
    if (!socketInstance) {
        socketInstance = io(socketUrl, {
            withCredentials: false,
            transports: ['websocket'],
            path: "/koa/socket.io"
        });
    }
    return socketInstance;
}
export function initializeSocket() {
    const socket = getSocket();
    // 监听游戏开始
    socket.on('duelStart', (data) => {
        console.log('对战开始！玩家列表:', data.players);
        // startGame();
    });

    // 监听对面发过来的卡组。
    socket.on("syncInitDeck", (data) => {
        console.log(data);
    });

    // // 监听对手事件
    // socket.on('duelEvent', (event) => {
    //     // handleOpponentAction(event);
    // });
}

// 创建房间
export function createDuelRoom() {
    const socket = getSocket();
    socket.emit('createDuelRoom', (res: any) => {
        if (res.roomId) {
            gameState.roomid = res.roomId;

            console.log(`房间创建成功，ID: ${gameState.roomid}`);
            // waitForOpponent();
        }
    });
}

// 加入房间
export function joinDuelRoom(roomId: string) {
    const socket = getSocket();
    socket.emit('joinDuelRoom', roomId, (res: any) => {
        if (res.error) {
            alert(res.error);
        } else {
            console.log(`成功加入房间，你是玩家${res.playerNumber}`);
        }
    });
}

export const sendInitDeck = (cards: Array<{ name: CARD_NAMES, id: string }>) => {
    const socket = getSocket();

    return socket.emit('initDeck', cards);
}