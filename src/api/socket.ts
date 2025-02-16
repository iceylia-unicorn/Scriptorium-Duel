import {io} from 'socket.io-client';
import {socketUrl} from "./index.ts";
// client.ts
const socket = io(socketUrl, {
    withCredentials: false,
    transports: ['websocket','polling'] // 与服务器一致
});


// 创建房间
export function createDuelRoom() {
    socket.emit('createDuelRoom', (res:any) => {
        if (res.roomId) {
            console.log(`房间创建成功，ID: ${res.roomId}`);
            // waitForOpponent();
        }
    });
}

// 加入房间
export function joinDuelRoom(roomId: string) {
    socket.emit('joinDuelRoom', roomId, (res:any) => {
        if (res.error) {
            alert(res.error);
        } else {
            console.log(`成功加入房间，你是玩家${res.playerNumber}`);
        }
    });
}

// 监听游戏开始
socket.on('duelStart', (data) => {
    console.log('对战开始！玩家列表:', data.players);
    // startGame();
});

// // 监听对手事件
// socket.on('duelEvent', (event) => {
//     // handleOpponentAction(event);
// });