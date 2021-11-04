export class NameBox extends Phaser.GameObjects.Rectangle {

    text: Phaser.GameObjects.Text

    /**
     * Erstellt ein Text auf einem Rechteck
     * @param scene die Szene
     * @param x die x-Position
     * @param y die y-Position
     * @param width die Breite des Rechtecks
     * @param font die Schriftart
     * @param fontSize die Größe der Schrift
     */
    constructor(scene: Phaser.Scene, x: number, y: number, width: number, font: string, fontSize: string) {
        super(
            scene, x, y, width, 118, 0xFFFFFF
        )

        this.text = new Phaser.GameObjects.Text(scene, x + 20, y + 10, '', { fontFamily: font, fontSize: fontSize, color: "black" })
        this.setOrigin(0, 0);
        scene.add.existing(this);
        scene.add.existing(this.text);
    }

}