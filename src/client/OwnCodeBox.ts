export class OwnCodeBox extends Phaser.GameObjects.Rectangle {
    text: Phaser.GameObjects.Text

    constructor(scene: Phaser.Scene, y: number) {
        super(
            scene, 428, y, 118, 118, 0xFFFFFF
        )
        this.text = new Phaser.GameObjects.Text(scene, 448 + 10, y + 15, "0", { fontFamily: 'daydream-webfont', fontSize: "70px", color: "black" })
        this.setOrigin(0, 0);
        this.text.setOrigin(0.5, 0);
        this.text.setPosition(487, y + 13);
        scene.add.existing(this);
        scene.add.existing(this.text);
    }
    setText(number: string) {
        this.text.setText(number);
    }
}