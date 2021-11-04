import { Data } from "phaser";
import { ClientMessageJoinFriend, ClientMessageNewClient, ClientMessageStartGame, ServerMessage } from "../Messages.js";
import { WebSocketController } from "./WebSocketController.js";
import { NameBox } from "./namebox.js";
import { MessageScene } from "./MessageScene.js";
import { NameIDData } from "../server/Server.js";
import { OwnCodeBox } from "./OwnCodeBox.js";

export type LobbyInfo = {
    host: boolean,
    code: number
}

export class LobbyScene extends MessageScene {


    constructor() {
        super({
            key: "LobbyScene"
        });
    }

    lobbyInfo: LobbyInfo;
    ownData: NameIDData;
    otherPlayers: NameIDData[];
    codeInputDOM: Phaser.GameObjects.DOMElement;
    blackGaps: Phaser.GameObjects.DOMElement[];
    largeText: Phaser.GameObjects.Text;
    webSocketController: WebSocketController;
    name: string;
    isAlreadyChecked: boolean = false;
    webSocketReady: boolean = false;
    stopUpdating: boolean = false;
    first: boolean = true;
    
    textSize: number = 1;
    scaler: boolean = true;

    nameScene: boolean;

    nameBoxes: NameBox[] = [];
    ownCodeBoxes: OwnCodeBox[] = [];

    /**
     * Wird als aller erstes ausgeführt, nimmt erstmal den Namen von der NameScene an
     * @param data die Daten (der eingegebene Name)
     */
    init(data) {
        this.name = data.givingName;
        this.otherPlayers = data.givenNames;
        this.nameScene = data.nameScene;
        this.lobbyInfo = data.lobbyInfo;
        this.ownData = data.ownData;
        this.webSocketController = data.webSocketController;
    }

    /**
     * Wird nach init() ausgefüht, und lädt erstmal alle nötigen Dateien
     */
    preload(): void {
        this.load.css('main', 'css/main.css');
        this.load.image('pointer', 'assets/sprites/pointer.cur');
        this.load.image('logovertical', 'assets/sprites/logovertical.png');
        this.load.html('codeInput', 'assets/text/codeInput.html');
        this.load.html('BlackGap', 'assets/text/BlackGap.html');
    }

    /**
     * Baut die Scene mit allen nötigen Elementen auf
     */
    create(): void {
        this.nameBoxes=[];
        this.ownCodeBoxes=[];
        
        for (let i = 0; i < 4; i++) {
            this.nameBoxes.push(new NameBox(this, 556, 289 + i * 128, 1186, 'lilian-webfont', "110px"));
            this.ownCodeBoxes.push(new OwnCodeBox(this, 289 + i * 128));
        }
        this.codeInputDOM = this.add.dom(359, 542).createFromCache('codeInput');
        
        this.blackGaps = [
            this.add.dom(350, 412).createFromCache('BlackGap'),
            this.add.dom(350, 540).createFromCache('BlackGap'),
            this.add.dom(360, 412 + 2 * (540 - 412)).createFromCache('BlackGap')
        ]
        
        this.input.setDefaultCursor('url(assets/sprites/pointer.cur), pointer');
        
        this.largeText = new Phaser.GameObjects.Text(this, 1920 / 2, 890, "JOIN OR HOST A GAME", { fontFamily: 'daydream-webfont', fontSize: "72px", color: "white" }).setOrigin(0.5, 0);
        this.add.existing(this.largeText);
        
        this.add.existing(new Phaser.GameObjects.Sprite(this, 234, 540, 'logovertical'));
        
        if (this.nameScene) {
            this.otherPlayers = [];
            this.webSocketController = new WebSocketController(this);
        } else {
            this.webSocketController.scene = this;
            this.changeCode(this.lobbyInfo.code);
            if (this.lobbyInfo.host) {
                this.makeHost();
            } else {
                this.makeMember(this.lobbyInfo.code, this.otherPlayers)
            }
        }
        
        
    }
    
    /**
     * Wird bei jedem game step aufgerufen und prüft jedes mal den Inhalt der Inputbox und skaliert den Text
     * @param time 
     * @param delta 
     */
    update(time: number, delta: number): void {
        if (!this.stopUpdating) {
            let inputText: any = this.codeInputDOM.getChildByName('codeInput');
            
            if (inputText.value.length == 4 && inputText.value != this.lobbyInfo.code) {
                if (this.isAlreadyChecked == false) {
                    let message: ClientMessageJoinFriend = {
                        id: "joinFriend",
                        newCode: inputText.value
                    }
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
     * Aktualisiert alle Namensboxen mit den aktuellen Namen aus otherPlayers
     */
    updateNames() {
        this.otherPlayers.forEach((e, i) => this.nameBoxes[i].text.setText(e.name));
    }

    changeCode(number: number) {
        this.ownCodeBoxes.forEach((e, i) => e.text.setText(String(number).charAt(i)));
    }

    /**
     * Beantwortet die Nachrichten des Servers
     * @param serverMessage die Nachricht des Servers
     */
    onMessage(serverMessage: ServerMessage) {

        switch (serverMessage.id) {
            case "codeAssignment":
                this.ownData = serverMessage.ownData;
                this.changeCode(serverMessage.code);
                this.lobbyInfo = { host: true, code: serverMessage.code };
                break;
            case "friendJoins":
                if (this.first && this.lobbyInfo.host) {
                    this.first = false;
                    this.makeHost();
                }

                for (let i = 0; i < 4; i++) {
                    this.otherPlayers.push(serverMessage.player);
                    this.updateNames();
                    break;
                }
                break;
            case "joiningFriend":
                this.lobbyInfo.host = false;
                this.lobbyInfo.code = serverMessage.code;
                if (this.largeText.input != null) {
                    this.largeText.input.enabled = false;
                }
                this.otherPlayers = serverMessage.newPlayers;
                this.makeMember(serverMessage.code, serverMessage.newPlayers);
                break;
            case "hostStartsTheGame":
                this.startGame();
                break;
            case "codeError":
                this.largeText.setText("CODE NOT FOUND")
                break;
            case "playerGone":
                this.otherPlayers.splice(this.otherPlayers.indexOf(serverMessage.player))
                this.updateNames();
                break;
            case "hostGone":
                this.largeText.setText("HOST LEFT THE GAME");
                this.scene.stop();
                break;
            case "hostStartsTheGame":
                this.startGame();
                break;
            case "serverFull":
                this.largeText.setText("SERVER FULL");
                break;
            case "gameRunning":
                this.largeText.setText("GAME IS RUNNING");
                break;
        }
    }

    makeMember(code: number, newNames: NameIDData[]) {
        this.updateNames();
        this.stopUpdating = true;
        this.codeInputDOM.destroy();
        this.blackGaps.forEach((e) => e.destroy());
        ["G", "A", "M", "E"].forEach((e, i) => new NameBox(this, 300, 289 + i * 128, 118, 'daydream-webfont', "70px").text.setText(e));
        this.changeCode(code);
        this.largeText.setText("WAIT FOR HOST TO START")
    }

    makeHost() {
        this.updateNames();
        this.largeText.setText("START GAME")
        this.largeText.setInteractive();
        this.largeText.on('pointerdown', function (event) {
            let message: ClientMessageStartGame = {
                id: "startGame",
            }
            this.webSocketController.send(message);
            this.startGame()
        }, this);
        this.stopUpdating = true;
        this.codeInputDOM.destroy();
        this.blackGaps.forEach((e) => e.destroy());
        ["H", "O", "S", "T"].forEach((e, i) => new NameBox(this, 300, 289 + i * 128, 118, 'daydream-webfont', "70px").text.setText(e));
    }

    /**
     * Startet das Spiel
     */
    startGame() {
        this.scene.start('ClientTetris', { givingNames: this.otherPlayers, webSocket: this.webSocketController, lobbyInfo: this.lobbyInfo, ownData: this.ownData })
    }

    /**
     * Sagt dem Server, dass der Websocket dieses Clients aktiv ist und schickt ihm den Namen
     */
    onWebSocketReady() {
        let message: ClientMessageNewClient = {
            id: "newClient",
            name: this.name,
        }
        this.webSocketController.send(message);
        this.webSocketReady = true;
    }

}