import { ServerMessage } from "../Messages.js";
import { WebSocketClient } from "./WebSocketClient.js";

//Abstrakte Klasse, damit WebSocketClient.ts den Wechsel von Szenen akzeptiert
export abstract class MessageScene extends Phaser.Scene {

    webSocketClient: WebSocketClient
    abstract onMessage(serverMessage: ServerMessage);
    abstract onWebSocketReady();

}