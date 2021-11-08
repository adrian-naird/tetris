import { NameIDData } from "./server/Server.js";

//Basiert auf: https://www.youtube.com/watch?v=acTb3UIKdRQ

//Die Clientnachrichten
export type ClientMessage = ClientMessageSendLine | ClientMessageNewClient | ClientMessageLineDrag | ClientMessageJoinFriend | ClientMessageStartGame | ClientMessageKeyPressed | ClientMessageEverythingRendered;

//Neuer Client
export type ClientMessageNewClient = {
    id: "newClient",
    name: string
}

//Der Client will einer Runde beitreten
export type ClientMessageJoinFriend = {
    id: "joinFriend",
    newCode: number
}

//Der Client startet das Spiel
export type ClientMessageStartGame = {
    id: "startGame"
}

//Der Client hat eine Taste gedrückt
export type ClientMessageKeyPressed = {
    id: "keyPressed",
    key: string
}

//Der Client hat eine gefüllte Reihe bewegt
export type ClientMessageLineDrag = {
    id: "lineDrag",
    y: number
}

//Der Client sendet einem Spieler eine Reihe
export type ClientMessageSendLine = {
    id: "sendLine",
    player: NameIDData
}

//Die ClientTetris Scene ist bereit und kann jetzt Infos von ServerTetris annehmen
export type ClientMessageEverythingRendered = {
    id: "everythingRendered"
}

//Die Servernachrichten
export type ServerMessage = ServerMessageUpdateCounter | ServerMessageUpdateShadow | ServerMessageUpdateNext | ServerMessageFriendJoins | ServerMessagePlayerWon | ServerMessageGameOver | ServerMessageNewLine | ServerMessageGone | ServerMessageNotification | ServerMessageJoiningFriend | ServerMessageCodeAssignment | ServerMessageNewField | ServerMessageUpdateHoldBrick;

//Der Server ordnet dem Client eine ClientData und seinen Code zu
export type ServerMessageCodeAssignment = {
    id: "codeAssignment",
    ownData: NameIDData,
    code: number
}

//Der Server benachrichtigt den Client
export type ServerMessageNotification = {
    id: "hostStartsTheGame" | "codeError" | "serverFull" | "gameRunning",
}

//Der Server sagt einem Client, dass ein anderer Spieler seiner Runde beitritt
export type ServerMessageFriendJoins = {
    id: "friendJoins",
    player: NameIDData
}

//Der Server teilt mit, dass ein Spieler die Runde verlassen hat
export type ServerMessageGone = {
    id: "hostGone" | "playerGone",
    player: NameIDData
}

//Der Server sagt dem Client, dass er dem Freund tatsächlich beitreten kann
export type ServerMessageJoiningFriend = {
    id: "joiningFriend",
    newPlayers: NameIDData[];
    code: number
}

//Der Server sagt dem Client, dass eine Linie ausgefüllt wurde
export type ServerMessageNewLine = {
    id: "newLine",
    lines: number[]
}

//Der Server gibt dem Client ein neues Feld zum anzeigen
export type ServerMessageNewField = {
    id: "newField",
    newField: number[][],
    player: NameIDData
}

//Der Server sagt dem Client, dass er oder ein Mitspieler verloren hat
export type ServerMessageGameOver = {
    id: "gameOver",
    player: NameIDData
}

//Der Server sagt dem Client, dass er oder ein Mitspieler gewonnen hat
export type ServerMessagePlayerWon = {
    id: "playerWon",
    player: NameIDData
}

//Der Server sagt dem Client, welcher Stein jetzt im Lager ist
export type ServerMessageUpdateHoldBrick = {
    id: "updateHoldBrick",
    holdID: number
}

//Der Server sagt dem Client, welche Steine nun als nächstes dran sind
export type ServerMessageUpdateNext = {
    id: "updateNext",
    nextBricks: number[]
}

//Der Server sagt dem Client, wo der ShadowBrick jetzt ist
export type ServerMessageUpdateShadow = {
    id: "updateShadow",
    xC: number,
    yC: number,
    stoneID: number,
    stones: boolean[][]
}

//Der Server sagt dem Client, wie viele Linien er bisher gefüllt hat
export type ServerMessageUpdateCounter = {
    id: "updateCounter",
    lineCounter: number
}