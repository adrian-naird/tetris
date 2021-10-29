import { ServerField } from "./client/Tetris/ServerTetris/ServerField";
import { NameIDData } from "./server/Server.js";

// die Clientnachrichten
export type ClientMessage = ClientMessageSendLine | ClientMessageNewClient | ClientMessageLineDrag | ClientMessageJoinFriend | ClientMessageStartGame | ClientMessageKeyPressed;

export type ClientMessageNewClient = {
    type: "newClient",
    name: string
}

export type ClientMessageJoinFriend = {
    type: "joinFriend",
    newCode: number
}

export type ClientMessageStartGame = {
    type: "startGame"
}

export type ClientMessageKeyPressed = {
    type: "keyPressed",
    key: string
}

export type ClientMessageLineDrag = {
    type: "lineDrag"
}

export type ClientMessageSendLine = {
    type: "sendLine",
    player: NameIDData
}

// die Servernachrichten
export type ServerMessage = ServerMessageUpdateNext | ServerMessageFriendJoins | ServerMessagePlayerWon | ServerMessageGameOver | ServerMessageNewLine | ServerMessageGone | ServerMessageNotification | ServerMessageJoiningFriend | ServerMessageCodeAssignment | ServerMessageNewField | ServerMessageUpdateHoldBrick;

export type ServerMessageCodeAssignment = {
    type: "codeAssignment",
    ownData: NameIDData,
    code: number
}

export type ServerMessageNotification = {
    type: "hostStartsTheGame" | "codeError" | "serverFull" | "gameRunning",
}

export type ServerMessageFriendJoins = {
    type: "friendJoins",
    player: NameIDData
}

export type ServerMessageGone = {
    type: "hostGone" | "playerGone",
    player: NameIDData
}

export type ServerMessageNewLine = {
    type: "newLine",
    lines: number[]
}

export type ServerMessageJoiningFriend = {
    type: "joiningFriend",
    newPlayers: NameIDData[];
    code: number
}

export type ServerMessageNewField = {
    type: "newField",
    newField: number[][],
    player: NameIDData
}

export type ServerMessageUpdateHoldBrick = {
    type: "updateHoldBrick",
    holdID: number
}
export type ServerMessageGameOver = {
    type: "gameOver",
    player: NameIDData
}

export type ServerMessagePlayerWon = {
    type: "playerWon",
    player: NameIDData
}

export type ServerMessageUpdateNext = {
    type: "updateNext",
    nextBricks: number[]
}