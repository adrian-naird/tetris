export class NameBox extends Phaser.GameObjects.Rectangle {
    text: Phaser.GameObjects.Text

    constructor(scene: Phaser.Scene, x: number, y: number, width: number, font: string, fontSize: string) {
        super(
            scene, x, y, width, 118, 0xFFFFFF
        )

        this.text = new Phaser.GameObjects.Text(scene, x + 20, y + 10, '', { fontFamily: font, fontSize: fontSize, color: "black" })
        this.setOrigin(0, 0);
        scene.add.existing(this);
        scene.add.existing(this.text);
    }
    setText(string: string) {
        this.text.setText(string)
    }
}