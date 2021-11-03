import { ServerField } from "./client/Tetris/ServerTetris/ServerField";
import { NameIDData } from "./server/Server.js";

// die Clientnachrichten
export type ClientMessage = ClientMessageSendLine | ClientMessageNewClient | ClientMessageLineDrag | ClientMessageJoinFriend | ClientMessageStartGame | ClientMessageKeyPressed | ClientMessageEverythingRendered;

export type ClientMessageNewClient = {
    id: "newClient",
    name: string
}

export type ClientMessageJoinFriend = {
    id: "joinFriend",
    newCode: number
}

export type ClientMessageStartGame = {
    id: "startGame"
}

export type ClientMessageKeyPressed = {
    id: "keyPressed",
    key: string
}

export type ClientMessageLineDrag = {
    id: "lineDrag"
}

export type ClientMessageSendLine = {
    id: "sendLine",
    player: NameIDData
}
export type ClientMessageEverythingRendered = {
    id: "everythingRendered"
}

// die Servernachrichten
export type ServerMessage = ServerMessageUpdateCounter | ServerMessageUpdateShadow | ServerMessageUpdateNext | ServerMessageFriendJoins | ServerMessagePlayerWon | ServerMessageGameOver | ServerMessageNewLine | ServerMessageGone | ServerMessageNotification | ServerMessageJoiningFriend | ServerMessageCodeAssignment | ServerMessageNewField | ServerMessageUpdateHoldBrick;

export type ServerMessageCodeAssignment = {
    id: "codeAssignment",
    ownData: NameIDData,
    code: number
}

export type ServerMessageNotification = {
    id: "hostStartsTheGame" | "codeError" | "serverFull" | "gameRunning",
}

export type ServerMessageFriendJoins = {
    id: "friendJoins",
    player: NameIDData
}

export type ServerMessageGone = {
    id: "hostGone" | "playerGone",
    player: NameIDData
}

export type ServerMessageNewLine = {
    id: "newLine",
    lines: number[]
}

export type ServerMessageJoiningFriend = {
    id: "joiningFriend",
    newPlayers: NameIDData[];
    code: number
}

export type ServerMessageNewField = {
    id: "newField",
    newField: number[][],
    player: NameIDData
}

export type ServerMessageUpdateHoldBrick = {
    id: "updateHoldBrick",
    holdID: number
}
export type ServerMessageGameOver = {
    id: "gameOver",
    player: NameIDData
}

export type ServerMessagePlayerWon = {
    id: "playerWon",
    player: NameIDData
}

export type ServerMessageUpdateNext = {
    id: "updateNext",
    nextBricks: number[]
}

export type ServerMessageUpdateShadow = {
    id: "updateShadow",
    xC: number,
    yC: number,
    stoneID: number,
    stones: boolean[][]
}

export type ServerMessageUpdateCounter = {
    id: "updateCounter",
    lineCounter: number
}