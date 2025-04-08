import {io, Socket} from 'socket.io-client';
import {socketUrl} from "./index.ts";
import type {CARD_NAMES} from "../babylon/Card-database.ts";
import {gameState} from "../babylon/gameState.ts";
import { EventEmitter } from 'events';
import type {App} from "vue";
export const eventEmitter = new EventEmitter();
// socket.ts
let socketInstance: Socket | null = null;

// 在每次使用socket实例前调用以确保有socket实例。
export function getSocket() {
    if (!socketInstance) {
        socketInstance = io(socketUrl, {
            withCredentials: false,
            transports: ['websocket'],
            // path: "/koa/socket.io",
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            randomizationFactor: 0.5
        });
    }
    return socketInstance;
}
export function initializeSocket():Promise<{event:string, data:string}> {
    return new Promise((resolve) => {
        const socket = getSocket();
        // 监听游戏开始
        socket.on('duelStart', (data) => {
            gameState.players = data.players;
            eventEmitter.emit('gameStarted');
        });

        // 监听对面发过来的卡组。
        socket.on("syncInitDeck", (data) => {
            gameState.opponentDeck = data;
            eventEmitter.emit('opponentDeckReceived');
            // console.log(data);
        });
        socket.on("duelEnd", (data)=>{

            console.log(data);
        })
        // 接收对方结束回合。
        socket.on('turnOver', (data:any) => {
            console.log(data);
            eventEmitter.emit('receiveOpponentTurnOver', data);
        });
        resolve({event:"initial", data:"success"});
    })


}

// 创建房间
export function createDuelRoom():Promise<{event:string, data:string}> {
    return new Promise((resolve) => {
        const socket = getSocket();
        socket.emit('createDuelRoom', (res: any) => {
            if (res.roomId) {
                gameState.roomID = res.roomId;
                resolve({event: 'createDuelRoom',data: res.roomId});
            }
        });
    })
}

// 加入房间
export function joinDuelRoom(roomId: string):Promise<{event:string, data:string}> {
    return new Promise((resolve, reject) => {
        const socket = getSocket();
        socket.emit('joinDuelRoom', roomId, (res: any) => {
            if (res.error) {
                reject(res.error);
            } else {
                resolve({event: 'joinDuelRoom',data: res.playerNumber});
            }
        });

    })

}

export const sendInitDeck = (cards: Array<{ name: CARD_NAMES, id: string }>) => {
    const socket = getSocket();

    return socket.emit('initDeck', cards);
}


export function provideEventEmitter(app:App) {
    app.provide('eventEmitter', eventEmitter);
}
export const sendCardPlacement = (cards: Array<{cardId: string, positionIndex: number}>) => {
    const socket = getSocket();
    socket.emit('turnOver', cards);
}