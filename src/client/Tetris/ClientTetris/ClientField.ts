import { ClientMessageKeyPressed } from "../../../Messages.js";
import { MessageScene } from "../../MessageScene.js";
import { ClientTetris } from "./ClientTetris.js";
import { SmallBrick } from "./SmallBrick.js";
import { Stone } from "./Stone.js";
export class ClientField {

    stoneGroups: Phaser.Physics.Arcade.Group[]= [];
    serverFieldLeft: number = 780;
    serverFieldTop: number = 180;
    holdBrick: SmallBrick;
    rKey: Phaser.Input.Keyboard.Key;
    hKey: Phaser.Input.Keyboard.Key;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    scene: ClientTetris;
    CamSet: boolean = false;
    Camera: Phaser.Cameras.Scene2D.Camera;
    nextBricks:  Phaser.Physics.Arcade.Group;
    constructor(scene: ClientTetris) {
        this.scene = scene;
        for (let i = 0; i < 5; i++) {
            this.stoneGroups[i] = new Phaser.Physics.Arcade.Group(scene.physics.world, scene);
        }
        this.rKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.hKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);
        this.cursors = this.scene.input.keyboard.createCursorKeys();

        this.rKey.on("down", () => { this.sendKeyMessage("R") })
        this.cursors.left.on("down", () => { this.sendKeyMessage("Ld") })
        this.cursors.left.on("up", () => { this.sendKeyMessage("Lu") })
        this.cursors.right.on("down", () => { this.sendKeyMessage("Rd") })
        this.cursors.right.on("up", () => { this.sendKeyMessage("Ru") })
        this.cursors.down.on("down", () => { this.sendKeyMessage("Dd") })
        this.cursors.down.on("up", () => { this.sendKeyMessage("Du") })
        this.hKey.on("up", () => { this.sendKeyMessage("H") })
        this.updateNextBricks([1,2,3,4,5]);
    }

    sendKeyMessage(key: string) {
        let message: ClientMessageKeyPressed = {
            type: "keyPressed",
            key: key
        }
        this.scene.webSocketController.send(message);
    }

    generateField(fieldArray: number[][],pos: number) {
        if(!this.CamSet){
            this.Camera = (<ClientTetris>this.scene).gameCams[pos];
            this.CamSet = true;
        }
        let yOffset = 0;
        let xOffset;
        switch(pos){
            case 0:
            xOffset= 780;
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
                    this.stoneGroups[pos].add(new Stone(this, fieldArray[x][y], x - 1, y - 5,xOffset,yOffset));
                }
            }
        }
    }

    updateHoldBrick(holdId: number) {
        if (this.holdBrick != null) {
            this.holdBrick.destroy(true);
        }
        this.holdBrick = new SmallBrick(this, holdId, 3000, 0,"HOLD");
    }
    updateNextBricks(array: number[]){
        array.forEach((brickId,index)=>{
            let smallBrick = new SmallBrick(this,brickId,-5500,index*163,"NEXT")
        })
    }
    destroy(pos: number) {
        this.stoneGroups[pos].clear(true, true);
    }

    gameOver(pos: number){
        
    }

}