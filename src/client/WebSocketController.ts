import { ClientMessage, ServerMessage } from "../Messages.js";
import { LobbyScene } from "./LobbyScene.js";
import { MessageScene } from "./MessageScene.js";

export class WebSocketController {

    connection: WebSocket;
    scene: MessageScene;

    constructor(private lobbyScene: MessageScene) {

        this.scene = lobbyScene;

        let url: string = (window.location.protocol.startsWith("https") ? "wss://" : "ws://") + window.location.host;
        this.connection = new WebSocket(url);

        let that = this;

        this.connection.onopen = function () {
            that.scene.onWebSocketReady();
        };

        this.connection.onmessage = function (message) {
            try {
                var serverMessage: ServerMessage = JSON.parse(message.data);
            } catch (e) {
                console.log('This doesn\'t look like a valid JSON: ',
                    message.data);
                return;
            }

            that.scene.onMessage(serverMessage);

        };

    }

    public changeScene(scene: MessageScene) {
        this.scene = scene;
    }

    public send(message: ClientMessage) {
        this.connection.send(JSON.stringify(message));
    }

}