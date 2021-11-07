import { ClientMessageEverythingRendered, ServerMessage } from "../../../Messages.js";
import { NameIDData } from "../../../server/Server.js";
import { LobbyInfo } from "../../LobbyScene.js";
import { MessageScene } from "../../MessageScene.js";
import { WebSocketClient } from "../../WebSocketClient.js";
import { ClientField } from "./ClientField.js";
import { FullRow } from "./FullRow.js";
import { ScrollingLogos } from "./Logo.js";
export class ClientTetris extends MessageScene {

    lobbyInfo: LobbyInfo
    ownData: NameIDData;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    background: Phaser.Physics.Arcade.Sprite;
    givenNames: NameIDData[];
    names: Phaser.GameObjects.Text[];
    field: ClientField;
    logoCam: Phaser.Cameras.Scene2D.Camera;
    holdCam: Phaser.Cameras.Scene2D.Camera;
    webSocketClient: WebSocketClient;
    gameCams: Phaser.Cameras.Scene2D.Camera[] = [];
    fullrows: FullRow[] = [];
    nextCam: Phaser.Cameras.Scene2D.Camera;
    logos: ScrollingLogos;
    textCam: Phaser.Cameras.Scene2D.Camera
    bool: boolean = false;
    largeText: Phaser.GameObjects.Text;

    constructor() {
        super({
            key: "ClientTetris"
        });
    }

    init(data) {
        this.givenNames = data.givingNames;
        this.ownData = data.ownData;
        this.webSocketClient = data.webSocket;
        this.webSocketClient.changeScene(this);
        this.lobbyInfo = data.lobbyInfo
    }

    preload(): void {
        this.load.image('ScrollingLogo', 'assets/graphics/ScrollingLogo.png')
        this.load.image('tetrisfelder', 'assets/graphics/tetrisfelder.png');
        this.load.atlas('tetrominos', 'assets/graphics/tetrominos_sprites.png', 'assets/graphics/tetrominos.json')
    }
    create(): void {
        //Hintergrund
        this.background = new Phaser.Physics.Arcade.Sprite(this, 0, 0, 'tetrisfelder').setOrigin(0, 0);
        this.add.existing(this.background);
        this.input.setDragState(this.input.activePointer, 1);
        let textStyle: Phaser.Types.GameObjects.Text.TextStyle = { fontFamily: 'lilian-webfont', fontSize: "40px", color: "white" };
        this.names = [
            this.add.text(175, 240, "", textStyle).setOrigin(0.5, 0),
            this.add.text(490, 240, "", textStyle).setOrigin(0.5, 0),
            this.add.text(1430, 240, "", textStyle).setOrigin(0.5, 0),
            this.add.text(1745, 240, "", textStyle).setOrigin(0.5, 0)
        ];
        this.camManagement();
        this.field = new ClientField(this);
        this.givenNames.forEach((e, i) => this.names[i].setText(e.name));
        this.logos = new ScrollingLogos(this);
        this.largeText = new Phaser.GameObjects.Text(this, 1920 / 2, -200, "", { fontFamily: 'lilian-webfont', fontSize: "72px", color: "white" }).setOrigin(0.5, 0.5).setAlign("center").setDepth(1100);
        this.add.existing(this.largeText);

        let message: ClientMessageEverythingRendered = {
            id: "everythingRendered"
        }
        this.webSocketClient.send(message);
    }


    camManagement() {
        // Scrollendes Logo Kamera
        this.logoCam = this.cameras.add(672, 318, 100, 582).setOrigin(0, 0).setScroll(-100, 0);
        this.logoCam.ignore(this.background);

        this.setGameCams();

        // hold Kamera
        this.holdCam = this.cameras.add(672, 198, 100, 112).setOrigin(0, 0).setScroll(-1000, 0);
        this.holdCam.setZoom(0.75);


        this.nextCam = this.cameras.add(1148, 198, 100, 479).setOrigin(0, 0)
        this.nextCam.ignore(this.background);
        this.names.forEach(e => this.nextCam.ignore(e));
    }

    makeRed(x: number, w: number) {
        this.add.existing(new Phaser.GameObjects.Rectangle(this, x, 0, w, 2000, 0xffffff)
            .setOrigin(0, 0).setBlendMode(Phaser.BlendModes.SATURATION).setDepth(1000));
        this.add.existing(new Phaser.GameObjects.Rectangle(this, x, 0, w, 2000, 0x5e5e5e, 0.6)
            .setOrigin(0, 0).setBlendMode(Phaser.BlendModes.DARKEN).setDepth(1000));
        this.add.existing(new Phaser.GameObjects.Rectangle(this, x, 0, w, 2000, 0x9e2b48)
            .setOrigin(0, 0).setBlendMode(Phaser.BlendModes.OVERLAY).setDepth(1000));
    }

    onMessage(serverMessage: ServerMessage) {
        if (this.field != undefined) {
            switch (serverMessage.id) {
                case "newField":
                    switch (serverMessage.player.id) {
                        case this.ownData.id:
                            this.field.generateField(serverMessage.newField, 0);
                            break;
                        case this.givenNames[0].id:
                            this.field.generateField(serverMessage.newField, 1);
                            break;
                        case this.givenNames[1].id:
                            this.field.generateField(serverMessage.newField, 2);
                            break;
                        case this.givenNames[2].id:
                            this.field.generateField(serverMessage.newField, 3);
                            break;
                        case this.givenNames[3].id:
                            this.field.generateField(serverMessage.newField, 4);
                            break;
                    }
                    break;
                case "updateHoldBrick":
                    this.field.updateHoldBrick(serverMessage.holdID);
                    break;
                case "newLine":
                    this.fullrows.forEach(e => e.destroy());
                    this.fullrows = [];
                    serverMessage.lines.forEach(e => this.fullrows.push(new FullRow(this.field, e - 5)));
                    break;
                case "gameOver":
                    this.gameOverPlayer(serverMessage.player);
                    break;
                case "playerGone":
                    this.gameOverPlayer(serverMessage.player)
                    this.givenNames.splice(this.givenNames.findIndex(e => e == serverMessage.player), 1)
                    break;
                case "hostGone":
                    this.largeText.setText("Host left the game")
                    this.textCam = this.cameras.add(1920 / 2 - 450, 450, 900, 200).setScroll(500, -300).ignore(this.background);
                    this.scene.stop("ClientTetris");
                    break;
                case "playerWon":
                    this.largeText.setText(serverMessage.player.name + " has won!")
                    this.textCam = this.cameras.add(1920 / 2 - 450, 450, 900, 200).setScroll(500, -300).ignore(this.background);
                    setTimeout(() => { this.children.getAll().forEach(e => e.destroy()); this.scene.start("LobbyScene", { givenNames: this.givenNames, NameScene: false, webSocketController: this.webSocketClient, lobbyInfo: this.lobbyInfo, ownData: this.ownData }) }, 5000)
                    break;
                case "updateNext":
                    this.field.updateNextBricks(serverMessage.nextBricks);
                    break;
                case "updateShadow":
                    this.field.updateShadowBrick(serverMessage.xC, serverMessage.yC, serverMessage.stoneID, serverMessage.stones);
                    break;
                case "updateCounter":
                    this.field.updateLineCounter(serverMessage.lineCounter);
                    break;
            }
        }
    }

    gameOverPlayer(player: NameIDData) {
        switch (player.id) {
            case this.ownData.id:
                this.makeRed(650, 630)
                this.makeRed(-5500, 1200)
                this.makeRed(-100, 100)
                this.makeRed(3000, 1000)
                this.logos.scene.events.removeAllListeners();
                this.field.gameOver();
                break;
            case this.givenNames[0].id:
                this.makeRed(-4000, 375)
                this.makeRed(30, 315)
                break;
            case this.givenNames[1].id:
                this.makeRed(-3000, 375)
                this.makeRed(345, 315)

                break;
            case this.givenNames[2].id:
                this.makeRed(-2000, 375)
                this.makeRed(1285, 315)

                break;
            case this.givenNames[3].id:
                this.makeRed(-1000, 375)
                this.makeRed(1600, 315)
                break;
        }
    }

    onWebSocketReady() { };

    setGameCams() {
        // damit dieses Array mit den Positionen in generateField übereinstimmt, wird die 0te stelle leer gelassen
        //  da man für das Mittlere Array keine Cam braucht
        for (let i = 1; i < 5; i++) {
            let xOffset;
            let scrollX;
            switch (i) {
                case 1:
                    xOffset = 40;
                    scrollX = -4000;
                    break;
                case 2:
                    xOffset = 355;
                    scrollX = -3000;
                    break;
                case 3:
                    xOffset = 1295;
                    scrollX = -2000;
                    break;
                case 4:
                    xOffset = 1610;
                    scrollX = -1000;
                    break;
            }
            this.gameCams[i] = this.cameras.add(xOffset, 294, 270, 540).setOrigin(0, 0).setZoom(0.75);
            this.gameCams[i].scrollX = scrollX;
        }
    }

}
