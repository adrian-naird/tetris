import { ServerMessage } from "../Messages.js";
import { WebSocketController } from "./WebSocketController.js";
export abstract class MessageScene extends Phaser.Scene {

    webSocketController: WebSocketController
    abstract onMessage(serverMessage: ServerMessage);
    abstract onWebSocketReady();
}