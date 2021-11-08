import { ServerMessage } from "../Messages.js";
import { WebSocketClient } from "./WebSocketClient.js";

export abstract class MessageScene extends Phaser.Scene {

    webSocketClient: WebSocketClient
    abstract onMessage(serverMessage: ServerMessage);
    abstract onWebSocketReady();

}