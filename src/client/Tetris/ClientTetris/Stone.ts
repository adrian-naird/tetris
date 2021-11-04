import { ClientField } from "./ClientField.js";

export class Stone extends Phaser.Physics.Arcade.Sprite {

    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    fieldX: number;
    fieldY: number;

    constructor(public field: ClientField, public id: number, public cx: number, public cy: number, xOffset: number, yOffset: number) {
        super(field.scene, cx * 36 + xOffset, cy * 36 + yOffset, 'tetrominos', 'Tetromino_' + id.toString());
        this.field.scene.add.existing(this);
    }

}