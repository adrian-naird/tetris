import { ClientMessageLineDrag, ClientMessageSendLine } from "../../../Messages.js";
import { ClientField } from "./ClientField.js";

export class FullRow extends Phaser.GameObjects.Rectangle {

    constructor(public field: ClientField, yC: number) {
        super(field.scene, 36 + field.serverFieldLeft - 36, yC * 36 + field.serverFieldTop, 360, 36, 0xffffff);
        this.setOrigin(0, 0);
        field.scene.add.existing(this);
        this.setDepth(999);
        this.setInteractive();
        this.field.scene.input.setDraggable(this, true);
        this.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            console.log("drag2")
            this.setPosition(dragX + 50, dragY + 5);
            this.setScale(0.75, 0.7);
            let message: ClientMessageLineDrag = {
                id: "lineDrag",
                y: yC
            }
            this.field.scene.webSocketClient.send(message);
        });
        this.on('dragend', (pointer: Phaser.Input.Pointer) => {
            if (200 < pointer.y && pointer.y < (200 + 700)) {
                if (900 < pointer.x && pointer.x < (900 + 350)) {
                    console.log("0")
                    this.sendMessage(0)
                } else if (294 < pointer.y && pointer.y < (294 + 540)) {
                    if (40 < pointer.x && pointer.x < (40 + 270)) {
                        console.log("1")
                        this.sendMessage(1)
                    } else if (355 < pointer.x && pointer.x < (355 + 270)) {
                        console.log("2")
                        this.sendMessage(2)
                    } else if (1295 < pointer.x && pointer.x < (1295 + 270)) {
                        console.log("3")
                        this.sendMessage(3)
                    } else if (1610 < pointer.x && pointer.x < (1610 + 270)) {
                        console.log("4")
                        this.sendMessage(4)
                    }
                }
            }
            this.field.scene.input.setDraggable(this, false);
            this.removeAllListeners();
            this.removeInteractive();
            this.destroy();
        })
    }

    sendMessage(number: number) {
        if (number > 0) {
            if (this.field.scene.givenNames[number - 1] != undefined) {
                let message: ClientMessageSendLine = {
                    id: "sendLine",
                    player: this.field.scene.givenNames[number - 1]
                }
                this.field.scene.webSocketClient.send(message);
            }
        } else {
            let message: ClientMessageSendLine = {
                id: "sendLine",
                player: this.field.scene.ownData
            }
            this.field.scene.webSocketClient.send(message);
        }
    }
}