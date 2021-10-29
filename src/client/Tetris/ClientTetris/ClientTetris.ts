import * as e from "express";
import { ServerMessage } from "../../../Messages.js";
import { NameIDData } from "../../../server/Server.js";
import { MessageScene } from "../../MessageScene.js";
import { WebSocketController } from "../../WebSocketController.js";
import { ClientField } from "./ClientField.js";
import { FullRow } from "./FullRow.js";
import { ScrollingLogos } from "./Logo.js";
export class ClientTetris extends MessageScene {

    ownData: NameIDData;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    background: Phaser.Physics.Arcade.Sprite;
    givenNames: NameIDData[];
    names: Phaser.GameObjects.Text[];
    field: ClientField;
    logoCam: Phaser.Cameras.Scene2D.Camera;
    holdCam: Phaser.Cameras.Scene2D.Camera;
    webSocketController: WebSocketController;
    gameCams: Phaser.Cameras.Scene2D.Camera[] = [];
    fullrows: FullRow[] = [];
    nextCam: Phaser.Cameras.Scene2D.Camera;

    constructor() {
        super({
            key: "ClientTetris"
        });
    }

    init(data) {
        this.givenNames = data.givingNames;
        this.ownData = data.ownData;
        this.webSocketController = data.webSocket;
        this.webSocketController.changeScene(this);
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
        // this.givenNames.forEach((e, i) => this.sideFields.push(new ClientField(this)));
        let l = new ScrollingLogos(this);
        // l.logo1.setDepth(50)
        // l.logo2.setDepth(50)
        // l.logo3.setDepth(50)
        // new FullRow(this.field,0,10,1);


    }


    camManagement() {
        // Scrollendes Logo Kamera
        this.logoCam = this.cameras.add(672, 318, 100, 582).setOrigin(0, 0).setScroll(-100, 0);
        this.logoCam.ignore(this.background);


        this.setGameCams();


        // hold Kamera
        this.holdCam = this.cameras.add(672, 198, 100, 112).setOrigin(0, 0).setScroll(-1000, 0);
        this.holdCam.setZoom(0.75);


        // Position der NextCam stimmt noch nicht:
        this.nextCam = this.cameras.add(1148, 198, 100, 479).setOrigin(0, 0)
        this.nextCam.ignore(this.background);


        // this.holdCam.setBackgroundColor('rgba(0, 0, 85, 1)');
    }

    onMessage(serverMessage: ServerMessage) {
        switch (serverMessage.type) {
            case "newField":
                if (this.field != undefined) {
                    // console.log(this.givenNames);
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
                }
                break;
            case "updateHoldBrick":
                this.field.updateHoldBrick(serverMessage.holdID);
                break;
            case "newLine":
                this.fullrows.forEach(e => e.destroy());
                this.fullrows = [];
                serverMessage.lines.forEach(e => this.fullrows.push(new FullRow(this.field, e - 5)));
                // this.fullrows.forEach(e => e.setDepth));
                break;
            case "gameOver":
            case "playerGone":
                switch (serverMessage.player.id) {
                    case this.ownData.id:
                        console.log("gameover")
                        this.field.gameOver(0);
                        break;
                    case this.givenNames[0].id:
                        this.field.gameOver(1);
                        this.names[0].setColor('rgba(152, 37, 67, 1)')
                        break;
                    case this.givenNames[1].id:
                        this.field.gameOver(2);
                        this.names[1].setColor('rgba(152, 37, 67, 1)')
                        break;
                    case this.givenNames[2].id:
                        this.field.gameOver(3);
                        this.names[2].setColor('rgba(152, 37, 67, 1)')
                        break;
                    case this.givenNames[3].id:
                        this.field.gameOver(4);
                        this.names[3].setColor('rgba(152, 37, 67, 1)')
                        break;
                }
                break;
            case "hostGone":
                
                break;
            case "playerWon":
                break;
            case "updateNext":
                this.field.updateNextBricks(serverMessage.nextBricks);
                break;
        }
    }

    gameOverPerson() { }

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
            // this.gameCams[i].setBackgroundColor('rgba(180, 0, 85, 0.25)');
        }
    }
}
