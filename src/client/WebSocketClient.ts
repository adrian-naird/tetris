import { ClientMessage, ServerMessage } from "../Messages.js";
import { MessageScene } from "./MessageScene.js";

export class WebSocketClient {

    connection: WebSocket;
    scene: MessageScene;

    /**
     * Richtet den WebSocket des Clients ein
     * @param lobbyScene die Szene des Clients (immer LobbyScene)
     */
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

    /**
     * Ändert die Szene, die der Client benutzt
     * @param scene die neue Szene
     */
    public changeScene(scene: MessageScene) {
        this.scene = scene;
    }
    /**
     * Versendet eine Nachricht des Clients an den Server
     * @param message die Nachricht
     */
    public send(message: ClientMessage) {
        this.connection.send(JSON.stringify(message));
    }

}