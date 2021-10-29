import { Data } from "phaser";
import { ClientMessageJoinFriend, ClientMessageNewClient, ClientMessageStartGame, ServerMessage } from "../Messages.js";
import { Boxes } from "./Boxes.js";
import { WebSocketController } from "./WebSocketController.js";
import { NameBox } from "./namebox.js";
import { MessageScene } from "./MessageScene.js";
import { NameIDData } from "../server/Server.js";

export class LobbyScene extends MessageScene {


    constructor() {
        super({
            key: "LobbyScene"
        });
    }

    host: boolean = false;
    ownData: NameIDData;
    otherPlayers: NameIDData[] = [];
    boxes: Boxes;
    codeInputDOM: Phaser.GameObjects.DOMElement;
    blackGaps: Phaser.GameObjects.DOMElement[];
    inputText: any;
    isAlreadyChecked: boolean = false;
    largeText: Phaser.GameObjects.Text;
    logoVertical: Phaser.GameObjects.Sprite;
    name: string;
    code: number;
    webSocketController: WebSocketController;
    webSocketReady: boolean = false;
    stopUpdating: boolean = false;
    first: boolean = true;
    textSize: number = 1;
    scaler: boolean = true;

    init(data) {
        this.name = data.givingName;
    }

    preload(): void {
        this.load.css('main', 'css/main.css');
        this.load.image('pointer', 'assets/sprites/pointer.cur');
        this.load.image('logovertical', 'assets/sprites/logovertical.png');
        this.load.html('codeInput', 'assets/text/codeInput.html');
        this.load.html('BlackGap', 'assets/text/BlackGap.html');
    }

    create(): void {
        this.codeInputDOM = this.add.dom(359, 542).createFromCache('codeInput');

        this.blackGaps = [
            this.add.dom(350, 412).createFromCache('BlackGap'),
            this.add.dom(350, 540).createFromCache('BlackGap'),
            this.add.dom(360, 412 + 2 * (540 - 412)).createFromCache('BlackGap')
        ]

        this.input.setDefaultCursor('url(assets/sprites/pointer.cur), pointer');

        this.largeText = new Phaser.GameObjects.Text(this, 1920 / 2, 890, "JOIN OR HOST A GAME", { fontFamily: 'daydream-webfont', fontSize: "72px", color: "white" }).setOrigin(0.5, 0);
        this.add.existing(this.largeText);

        this.logoVertical = new Phaser.GameObjects.Sprite(this, 234, 540, 'logovertical');
        this.add.existing(this.logoVertical);

        this.boxes = new Boxes(this);

        this.webSocketController = new WebSocketController(this);
    }

    /**
     * Überprüft den Inhalt der Inputbox un
     * @param time 
     * @param delta 
     */
    update(time: number, delta: number): void {
        if (!this.stopUpdating) {
            this.inputText = this.codeInputDOM.getChildByName('codeInput');

            if (this.inputText.value.length == 4 && this.inputText.value != this.code) {
                if (this.isAlreadyChecked == false) {
                    let message: ClientMessageJoinFriend = {
                        type: "joinFriend",
                        newCode: this.inputText.value
                    }
                    this.host = true;
                    this.webSocketController.send(message);
                    this.isAlreadyChecked = true;
                }
            } else {
                this.isAlreadyChecked = false;
            }
        }

        if (this.textSize <= 0.98) {
            this.scaler = true;
        } else {
            if (this.textSize >= 1.02) {
                this.scaler = false;
            }
        }
        if (this.scaler) {
            this.textSize = this.textSize + 0.001;
        } else {
            this.textSize = this.textSize - 0.001;
        }
        this.largeText.setScale(this.textSize);
    }

    /**
     * Beantwortet die Nachrichten des Servers
     * @param serverMessage die Nachricht des Servers
     */
    onMessage(serverMessage: ServerMessage) {

        switch (serverMessage.type) {
            case "codeAssignment":
                this.ownData = serverMessage.ownData;
                this.boxes.changeCode(serverMessage.code);
                this.code = serverMessage.code;
                break;
            case "friendJoins":
                if (this.first && !this.host) {
                    this.first = false;
                    this.largeText.setText("START GAME")
                    this.largeText.setInteractive();
                    this.largeText.on('pointerdown', function (event) {
                        let message: ClientMessageStartGame = {
                            type: "startGame",
                        }
                        this.webSocketController.send(message);
                        this.scene.start('ClientTetris', { givingNames: this.otherPlayers, webSocket: this.webSocketController, ownData: this.ownData });
                    }, this);
                    this.stopUpdating = true;
                    this.codeInputDOM.destroy();
                    this.blackGaps.forEach((e) => e.destroy());
                    ["H", "O", "S", "T"].forEach((e, i) => new NameBox(this, 300, 289 + i * 128, 118, 'daydream-webfont', "70px").setText(e));
                }

                for (let i = 0; i < 4; i++) {
                    this.otherPlayers.push(serverMessage.player);
                    this.boxes.addName(serverMessage.player.name);
                    break;
                }
                break;
            case "joiningFriend":
                this.code = serverMessage.code;
                if (this.largeText.input != null) {
                    this.largeText.input.enabled = false;
                }
                this.otherPlayers = serverMessage.newPlayers;
                this.stopUpdating = true;
                this.codeInputDOM.destroy();
                this.blackGaps.forEach((e) => e.destroy());
                ["G", "A", "M", "E"].forEach((e, i) => new NameBox(this, 300, 289 + i * 128, 118, 'daydream-webfont', "70px").setText(e));
                this.boxes.changeCode(serverMessage.code);
                this.boxes.newNames(serverMessage.newPlayers);
                this.largeText.setText("WAIT FOR HOST TO START")
                break;
            case "hostStartsTheGame":
                this.scene.start('ClientTetris', { givingNames: this.otherPlayers, webSocket: this.webSocketController, ownData: this.ownData });
                break;
            case "codeError":
                this.largeText.setText("CODE NOT FOUND")
                break;
            case "playerGone":
                for (let i = 0; i < 4; i++) {
                    if (this.otherPlayers[i] == serverMessage.player) {
                        this.otherPlayers[i] = null;
                    }
                }
                this.boxes.removeName(serverMessage.player.name);
                break;

            case "hostGone":
                this.largeText.setText("HOST LEFT THE GAME");
                for (let i = 0; i < 4; i++) {
                    if (this.otherPlayers[i] == serverMessage.player) {
                        this.otherPlayers[i] = null;
                    }
                }
                this.boxes.removeName(serverMessage.player.name);
                break;
            case "hostStartsTheGame":
                this.scene.start('ClientTetris', { givingNames: this.otherPlayers, webSocket: this.webSocketController });
                break;
            case "serverFull":
                this.largeText.setText("SERVER FULL");
                break;
            case "gameRunning":
                this.largeText.setText("GAME IS RUNNING");
                break;
        }
    }

    /**
     * Überprüft ob die eigene Runde voll ist
     * @returns Die Anzahl der Mitspieler, 4 bedeutet es ist voll
     */
    isFull(): number {
        for (let i = 0; i < 4; i++) {
            if (this.otherPlayers[i] == null) {
                return i;
            }
        }
        return 4;
    }

    /**
     * Sagt dem Server, dass der Websocket dieses Clients aktiv ist und schickt im den Namen
     */
    onWebSocketReady() {
        let message: ClientMessageNewClient = {
            type: "newClient",
            name: this.name,
        }
        this.webSocketController.send(message);
        this.webSocketReady = true;
    }
}