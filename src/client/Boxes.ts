import { NameIDData } from "../server/Server.js";
import { NameBox } from "./namebox.js";
import { OwnCodeBox } from "./OwnCodeBox.js";

export class Boxes {
    nameBoxes: NameBox[];
    ownCodeBoxes: OwnCodeBox[];
    nameList: string[];

    constructor(scene: Phaser.Scene) {
        this.nameList = [];
        this.nameBoxes = [];
        this.ownCodeBoxes = [];
        for (let i = 0; i < 4; i++) {
            this.nameBoxes.push(new NameBox(scene, 556, 289 + i * 128, 1186, 'lilian-webfont', "110px"));
            this.ownCodeBoxes.push(new OwnCodeBox(scene, 289 + i * 128));
        }
    }

    /**
     * Ersetzt alle Namen mit den neuen und lässt dann die Namensboxen updaten
     * @param names ClientData Array mit allen Mitspielern
     */
    newNames(names: NameIDData[]) {
        this.nameList = [];
        names.forEach((e, i) => this.nameList.push(e.name));
        this.updateNames();
    }

    /**
     * Aktualisiert alle Namensboxen mit den aktuellen Namen aus nameList
     */
    updateNames() {
        if (this.nameList.length == 0) {
            this.nameBoxes.forEach((e, i) => this.nameBoxes[i].text.setText(""))
        }
        this.nameList.forEach((e, i) => this.nameBoxes[i].text.setText(e))
    }

    /**
     * Fügt <strong>einen</strong> neuen Namen der Namensliste hinzu und lässt dann die Anzeige aktualisieren
     * @param name Neuer Name
     */
    addName(name: string) {
        this.nameList.push(name);
        this.updateNames();
    }

    /**
     * Entfernt den Namen aus der Namensliste und lässt die Anzeige aktualisieren
     * @param name zu entfernender Name
     */
    removeName(name: string) {
        this.nameList.forEach((e, i) => {
            if (this.nameList[i] == name) {
                this.nameList.splice(i, 1);
                this.updateNames();
            }
        })
    }

    /**
     * Ändert die Anzeige des Codes
     * @param number neuer Code 
     */
    changeCode(number: number) {
        this.ownCodeBoxes.forEach((e, i) => e.text.setText(String(number).charAt(i)));
    }
}