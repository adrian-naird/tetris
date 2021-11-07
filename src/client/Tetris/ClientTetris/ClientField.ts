import { ClientMessageKeyPressed } from "../../../Messages.js";
import { ClientTetris } from "./ClientTetris.js";
import { SmallBrick } from "./SmallBrick.js";
import { Stone } from "./Stone.js";
export class ClientField {


    stoneGroups: Phaser.Physics.Arcade.Group[] = [];
    serverFieldLeft: number = 780;
    serverFieldTop: number = 180;
    holdBrick: SmallBrick;
    rKey: Phaser.Input.Keyboard.Key;
    hKey: Phaser.Input.Keyboard.Key;
    fKey: Phaser.Input.Keyboard.Key;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    scene: ClientTetris;
    CamSet: boolean = false;
    Camera: Phaser.Cameras.Scene2D.Camera;
    nextBricks: SmallBrick[] = [];
    shadowBrick: Phaser.Physics.Arcade.Group;
    counterText1: Phaser.GameObjects.Text;
    counterText2: Phaser.GameObjects.Text;

    constructor(scene: ClientTetris) {
        this.scene = scene;
        for (let i = 0; i < 5; i++) {
            this.stoneGroups[i] = new Phaser.Physics.Arcade.Group(scene.physics.world, scene);
        }
        this.nextBricks.forEach(e => e.clear(true, true));
        this.shadowBrick = new Phaser.Physics.Arcade.Group(scene.physics.world, scene);
        this.rKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.hKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);
        this.fKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        this.cursors = this.scene.input.keyboard.createCursorKeys();

        this.rKey.on("down", () => { this.sendKeyMessage("R") })
        this.hKey.on("up", () => { this.sendKeyMessage("H") })
        this.fKey.on("up", () => { this.sendKeyMessage("F") })
        this.cursors.left.on("down", () => { this.sendKeyMessage("Ld") })
        this.cursors.left.on("up", () => { this.sendKeyMessage("Lu") })
        this.cursors.right.on("down", () => { this.sendKeyMessage("Rd") })
        this.cursors.right.on("up", () => { this.sendKeyMessage("Ru") })
        this.cursors.down.on("down", () => { this.sendKeyMessage("Dd") })
        this.cursors.down.on("up", () => { this.sendKeyMessage("Du") })
    }

    sendKeyMessage(key: string) {
        let message: ClientMessageKeyPressed = {
            id: "keyPressed",
            key: key
        }
        this.scene.webSocketClient.send(message);
    }

    generateField(fieldArray: number[][], pos: number) {
        if (!this.CamSet) {
            this.Camera = (<ClientTetris>this.scene).gameCams[pos];
            this.CamSet = true;
        }
        let yOffset = 0;
        let xOffset;
        switch (pos) {
            case 0:
                xOffset = 780;
                yOffset = 180;
                break;
            case 1:
                xOffset = -4000;
                break;
            case 2:
                xOffset = -3000;
                break;
            case 3:
                xOffset = -2000;
                break;
            case 4:
                xOffset = -1000;
                break;
        }

        this.destroy(pos);
        for (let y = 1; y < fieldArray[1].length - 1; y++) {
            for (let x = 1; x < fieldArray.length - 1; x++) {
                if (fieldArray[x][y] != 0 && fieldArray[x][y] != -1) {
                    this.stoneGroups[pos].add(new Stone(this, fieldArray[x][y], x - 1, y - 5, xOffset, yOffset));
                }
            }
        }
    }

    updateHoldBrick(holdId: number) {
        if (this.holdBrick != null) {
            this.holdBrick.destroy(true);
        }
        this.holdBrick = new SmallBrick(this, holdId, 3000, 0, "HOLD");
    }

    updateNextBricks(array: number[]) {
        this.nextBricks.forEach(e => e.clear(true, true));
        this.nextBricks = [];
        array.forEach((brickId, index) => { this.nextBricks.push(new SmallBrick(this, brickId, -5500, index * 163, "NEXT")) })
    }

    updateShadowBrick(xC: number, yC: number, id: number, stones: boolean[][]) {
        this.shadowBrick.clear(true, true);
        let fieldX;
        let fieldY;
        for (let x = 0; x < stones.length; x++) {
            for (let y = 0; y < stones.length; y++) {
                if (stones[x][y]) {
                    fieldX = xC + x;
                    fieldY = yC + y;
                    let stone = new Stone(this, id, fieldX, fieldY, this.serverFieldLeft, this.serverFieldTop)
                    this.shadowBrick.add(stone);
                    stone.setAlpha(0.5);
                }
            }
        }
    }

    updateLineCounter(lineCounter: number) {
        if (this.counterText2 != null) {
            this.counterText1.destroy();
            this.counterText2.destroy();
        }
        if (lineCounter > 9) {
            this.counterText1 = new Phaser.GameObjects.Text(this.scene, 1198, 694, lineCounter.toString().charAt(0),
                { fontFamily: 'daydream-webfont', fontSize: "75px", color: "white" }).setOrigin(0.5, 0);
            this.scene.add.existing(this.counterText1);
            this.counterText2 = new Phaser.GameObjects.Text(this.scene, 1198, 794, lineCounter.toString().charAt(1),
                { fontFamily: 'daydream-webfont', fontSize: "75px", color: "white" }).setOrigin(0.5, 0);
            this.scene.add.existing(this.counterText2);
        }
        else {
            this.counterText1 = new Phaser.GameObjects.Text(this.scene, 1198, 694, "0",
                { fontFamily: 'daydream-webfont', fontSize: "75px", color: "white" }).setOrigin(0.5, 0);
            this.scene.add.existing(this.counterText1);
            this.counterText2 = new Phaser.GameObjects.Text(this.scene, 1198, 794, lineCounter.toString(),
                { fontFamily: 'daydream-webfont', fontSize: "75px", color: "white" }).setOrigin(0.5, 0);
            this.scene.add.existing(this.counterText2);
        }
    }

    gameOver() {
        this.rKey.off("down");
        this.hKey.off("up");
        this.fKey.off("up");
        this.cursors.left.off("up");
        this.cursors.left.off("down");
        this.cursors.right.off("up");
        this.cursors.right.off("down");
        this.cursors.down.off("up");
        this.cursors.down.off("down");
        this.nextBricks.forEach(e => e.clear(true, true));
        this.nextBricks = [];
    }

    destroy(pos: number) {
        this.stoneGroups[pos].clear(true, true);
    }

}