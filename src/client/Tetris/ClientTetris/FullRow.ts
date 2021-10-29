import { ClientMessageLineDrag, ClientMessageSendLine } from "../../../Messages.js";
import { ClientField } from "./ClientField.js";
import { ClientTetris } from "./ClientTetris.js";

export class FullRow extends Phaser.GameObjects.Rectangle {

    constructor(public field: ClientField, y: number) {
        super(field.scene, 36 + field.serverFieldLeft - 36, y * 36 + field.serverFieldTop, 360, 36, 0xffffff);
        this.setDepth(100);
        this.setOrigin(0, 0);
        field.scene.add.existing(this);
        this.setInteractive();
        this.field.scene.input.setDraggable(this);
        this.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            this.setPosition(dragX + 50, dragY + 5);
            this.setScale(0.75, 0.7);
            let message: ClientMessageLineDrag = {
                type: "lineDrag"
            }
            this.field.scene.webSocketController.send(message);
        });
        this.on('dragend', (pointer: Phaser.Input.Pointer) => {
            if (200 < pointer.y && pointer.y < (200 + 700)) {
                if (900 < pointer.x && pointer.x < (900 + 350)) {
                    this.sendMessage(0)
                } else if (294 < pointer.y && pointer.y < (294 + 540)) {
                    if (40 < pointer.x && pointer.x < (40 + 270)) {
                        this.sendMessage(1)
                    } else if (355 < pointer.x && pointer.x < (355 + 270)) {
                        this.sendMessage(2)
                    } else if (1295 < pointer.x && pointer.x < (1295 + 270)) {
                        this.sendMessage(3)
                    } else if (1610 < pointer.x && pointer.x < (1610 + 270)) {
                        this.sendMessage(4)
                    }
                }
            }
            this.destroy();
        })
    }

    sendMessage(number: number) {
        if (number > 0) {
            if (this.field.scene.givenNames[number - 1] != undefined) {
                let message: ClientMessageSendLine = {
                    type: "sendLine",
                    player: this.field.scene.givenNames[number - 1]
                }
                this.field.scene.webSocketController.send(message);
            }
        } else {
            let message: ClientMessageSendLine = {
                type: "sendLine",
                player: this.field.scene.ownData
            }
            this.field.scene.webSocketController.send(message);
        }
    }
}