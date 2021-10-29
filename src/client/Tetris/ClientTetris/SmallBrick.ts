import { MessageScene } from "../../MessageScene.js";
import { ClientField } from "./ClientField.js";
import { ClientTetris } from "./ClientTetris.js";

export class SmallBrick extends Phaser.Physics.Arcade.Group {
    public stones: boolean[][];
    public holdCam: Phaser.Cameras.Scene2D.Camera;
    left: number;
    top: number;
    constructor(public field: ClientField, public id: number, left: number, top: number, type: string) {
        super(field.scene.physics.world, field.scene);
        let camera;
        if (type == "HOLD") {
            camera = (<ClientTetris>this.field.scene).holdCam;
            camera.setZoom(0.6);
            camera.scrollX = left;
            camera.scrollY = top;
            (<ClientTetris>this.field.scene).gameCams[1].ignore(this);

        }
        if (type == "NEXT") {
            camera = (<ClientTetris>this.field.scene).nextCam;
            camera.setZoom(0.6);
            camera.scrollX = left;
            camera.scrollY = top - 630;
        }
        switch (id) {
            case 1:
                this.stones = [
                    [false, false, false, false],
                    [false, true, true, false],
                    [false, true, true, false],
                    [false, false, false, false],
                ];
                // camera.setZoom(0.75);
                this.left = left + 15;
                this.top = top + 20
                break;
            case 2:
                this.stones = [
                    [false, true, false],
                    [false, true, true],
                    [false, false, true],
                ];
                this.left = left + 25;
                this.top = top;
                break;
            case 3:
                this.stones = [
                    [false, false, true],
                    [true, true, true],
                    [false, false, false],
                ];
                this.left = left + 45;
                this.top = top + 30
                break;
            case 4:
                this.stones = [
                    [false, false, false, false],
                    [true, true, true, true],
                    [false, false, false, false],
                    [false, false, false, false]
                ];
                // camera.setZoom(0.5);
                this.left = left + 30;
                this.top = top + 20
                break;
            case 5:
                this.stones = [
                    [false, false, false],
                    [true, true, true],
                    [false, false, true],
                ];
                this.left = left + 18;
                this.top = top + 30
                break;
            case 6:
                this.stones = [
                    [true, true, false],
                    [false, true, true],
                    [false, false, false],
                ];
                this.left = left + 50;
                this.top = top + 40;
                break;
            case 7:
                this.stones = [
                    [false, true, false],
                    [true, true, false],
                    [false, true, false],
                ];
                this.left = left + 33;
                this.top = top + 55;
                break;
        }
        this.generateBrick(this.stones, this.left, this.top);
    }

    generateBrick(stones: boolean[][], left: number, top: number) {
        super.clear(true, true);
        for (let x = 0; x < stones.length; x++) {
            for (let y = 0; y < stones.length; y++) {
                if (stones[x][y]) {
                    let stone = new Phaser.Physics.Arcade.Sprite(this.field.scene, (x * 36) + left, (y * 36) + top, 'tetrominos', 'Tetromino_' + this.id.toString()).setDepth(800);
                    (<ClientTetris>this.field.scene).gameCams[4].ignore(stone);
                    // (<ClientTetris>this.field.scene).cameras.main.ignore(stone);
                    this.add(stone);
                    this.field.scene.add.existing(stone);
                }
            }
        }
    }
}