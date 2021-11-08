import { Brick } from "./ServerBrick";
import { ServerMessageGameOver, ServerMessageNewField, ServerMessageNewLine, ServerMessageUpdateCounter, ServerMessageUpdateHoldBrick, ServerMessageUpdateNext } from "../../../Messages.js";
import { MainServer } from "../../../server/Server";
import { ClientData } from "../../../server/Server";

export class ServerField {


    brick: Brick;
    fieldNumberArray: number[][];
    lines: number[];
    waitForAnimation: boolean = false;
    lineDestroyDelay: number = 1000;
    holdId: number;
    firstHoldBrick: boolean = true;
    clientData: ClientData;
    server: MainServer;
    remove: boolean = false;
    lineHasBeenSent: boolean = false;
    gameNotOver: boolean = true;
    nextBricksArray: number[] = [];
    firstBrick: boolean = true;
    lineCounter: number = 0;
    updateBoolean: boolean = true;
    lastFreeHoleAtGreyLine: number = Math.ceil(Math.random() * 10);
    holdBrickAlreadyChangedOnce: boolean = false;
    greyLines: number[] = [];
    solvedLinesToRemove: number[] = [];
    linesCheckedOnce: boolean = false;
    constructor(clientData: ClientData, server: MainServer) {
        this.server = server;
        this.clientData = clientData;
        this.lines = [];
        this.setStartField();


        this.createNextBricksArray(this.nextBricksArray);
        this.brick = new Brick(this, this.nextBricksArray.shift());

    }

    createNextBricksArray(array: number[]) {
        for (let i = 0; i < 7; i++) {
            array[i] = i + 1;
        }
        this.shuffleArray(array);
    }

    // see: https://www.codegrepper.com/code-examples/javascript/shuffle+array+values+typescript
    shuffleArray(array: number[]) {

        let currentIndex = array.length, temporaryValue, randomIndex;
        while (0 != currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }

    changeHoldBrick() {
        this.createCurrentFieldArray();
        if (!this.holdBrickAlreadyChangedOnce) {
            if (!this.firstHoldBrick) {
                let newBrickId = this.holdId;
                this.holdId = this.brick.id;
                this.brick.destroy();
                this.brick = new Brick(this, newBrickId);
                this.holdBrickAlreadyChangedOnce = true;
            } else {
                this.holdId = this.brick.id;
                this.brick.destroy();
                this.brick = new Brick(this, Math.ceil(Math.random() * 7));
                this.firstHoldBrick = false;
                this.holdBrickAlreadyChangedOnce = true;
            }
            this.sendUpdateHoldBrickMessage(this.holdId);
            this.brick.updateShadowBrick();
        }
    }

    sendUpdateHoldBrickMessage(holdId: number) {
        if (this.updateBoolean) {
            let suhb: ServerMessageUpdateHoldBrick = {
                id: "updateHoldBrick",
                holdID: holdId
            };
            this.clientData.socket.send(JSON.stringify(suhb));
        }
    }
    updateNextBricks() {
        let array = this.nextBricksArray.slice(0, 5);
        this.sendUpdateNextBricksMessage(array);
    }

    sendUpdateNextBricksMessage(array: number[]) {
        if (this.updateBoolean) {
            let smu: ServerMessageUpdateNext = {
                id: "updateNext",
                nextBricks: array
            }
            this.clientData.socket.send(JSON.stringify(smu))
        }
    }

    createCurrentFieldArray(): number[][] {
        let fieldX: number;
        let fieldY: number;
        let currentFieldArray = this.cloneArray(this.fieldNumberArray);
        if (this.brick != null) {
            for (let x = 0; x < this.brick.stones.length; x++) {
                for (let y = 0; y < this.brick.stones.length; y++) {
                    if (this.brick.stones[x][y]) {

                        fieldX = this.brick.xC + x + 1;
                        fieldY = this.brick.yC + y + 5;

                        currentFieldArray[fieldX][fieldY] = this.brick.id;

                    }
                }

            }
        }
        return currentFieldArray;
    }

    cloneArray(originalArray: number[][]): number[][] {
        let newArray: number[][] = [];
        for (let x = 0; x < originalArray.length; x++) {
            newArray[x] = [];
            for (let y = 0; y < originalArray[0].length; y++) {
                newArray[x][y] = originalArray[x][y];

            }
        }
        return newArray;
    }

    destroyBrick() {
        if (this.brick == null) { return }
        this.addBrickToFieldArray();
        if (this.checkGameOver()) { this.gameOver() }
        this.checkForLines();
        this.newBrick();
        this.updateField();
    }


    checkGameOver(): boolean {
        for (let x = 1; x <= 10; x++) {
            for (let y = 0; y < 4; y++) {
                if (this.fieldNumberArray[x][y] != 0 && this.gameNotOver) {
                    // this.gameOver();
                    return true;
                }
            }
        }
        return false;
    }

    gameOver() {
        this.gameNotOver = false;
        let snl: ServerMessageGameOver = {
            id: "gameOver",
            player: this.server.nameIDDatafy(this.clientData)
        };
        this.nextBricksArray = [];
        this.updateBoolean = false;
        this.clientData.socket.send(JSON.stringify(snl));
        this.server.sendToMembers(snl, this.clientData);
        this.server.checkIfWon(this.clientData)
    }

    addBrickToFieldArray() {
        // Eintragen des alten Steins ins FieldArray
        let fieldX: number;
        let fieldY: number;


        for (let x = 0; x < this.brick.stones.length; x++) {
            for (let y = 0; y < this.brick.stones.length; y++) {
                if (this.brick.stones[x][y]) {

                    fieldX = this.brick.xC + x + 1;
                    fieldY = this.brick.yC + y + 5;

                    this.fieldNumberArray[fieldX][fieldY] = this.brick.id;

                }
            }

        }
        this.brick.destroy();
    }

    newBrick() {
        this.sendUpdateLinesMessage();
        if (this.updateBoolean) {
            setTimeout(() => {
                // Erstellen des neuen Steins
                if (this.lineHasBeenSent) {
                    this.addLineAtBottom();
                    this.lineHasBeenSent = false;
                }
                if (this.nextBricksArray.length < 8) {
                    let newArray = [];
                    this.createNextBricksArray(newArray);
                    this.nextBricksArray = this.nextBricksArray.concat(newArray);
                }
                this.brick = new Brick(this, this.nextBricksArray.shift());
                this.updateNextBricks();
            }, 200)
        }
    }

    sendUpdateLinesMessage() {
        let snl: ServerMessageNewLine = {
            id: "newLine",
            lines: this.lines
        };
        this.clientData.socket.send(JSON.stringify(snl));
    }

    checkForLines() {
        this.lines = [];
        for (let y = 5; y <= 24; y++) {
            this.checkOneLine(y);
        }
        if (this.greyLines.length > 0) {
            this.removeGivenLines(this.greyLines);
        }
        if (this.solvedLinesToRemove.length > 0) {
            this.removeGivenLines(this.solvedLinesToRemove);
            // Die folgenden Zeilen entfernen jedes Element welches in "solvedLinesToRemove" vorhanden ist aus this.lines
            this.lines = this.lines.filter(e => {
                return this.solvedLinesToRemove.indexOf(e) < 0;
            });
            this.solvedLinesToRemove = [];
        }
        console.log(this.lines);
        this.sendUpdateLinesMessage();

    }
    checkOneLine(y: number) {
        for (let x = 1; x <= 10; x++) {
            if (this.fieldNumberArray[x][y] == 0) { return }

        }
        if ((this.fieldNumberArray[1][y] == 8 || this.fieldNumberArray[2][y] == 8) &&
            (!this.greyLines.some(element => element == y))) {
            this.greyLines.push(y);
            this.greyLines.sort();
        }
        // Das Programm landet hier wenn eine Reihe an der Stelle y vervollständigt wurde:
        else if (!this.lines.some(element => element == y)) {
            this.lines.push(y);
            this.lines.sort();
            this.sendUpdateLinesMessage();
        }
    }
    removeGivenLines(lines: number[]) {
        this.waitForAnimation = true;
        lines.forEach(e => {
            this.removeLineDestroyAnimation(e);

        });
        this.lineDestroyDelay = 1000;
        lines.forEach(e => {
            setTimeout(() => {
                this.waitForAnimation = false;
                this.lineDestroyDelay = 15;
                // die erste gelöste Reihe wird entfernt, 
                // am Ende von removeSolvedLine wird nochmal überprüft ob es gelöste Reihen gibt.
                this.removeSolvedLine(lines[0]);
            }, this.lineDestroyDelay)
        })
    }
    removeLineDestroyAnimation(fieldY: number) {
        let fieldArray = this.fieldNumberArray.slice();
        for (let x = 1; x < fieldArray.length - 1; x++) {
            fieldArray[x][fieldY] = 0;
        }
        this.updateField()
    }

    removeSolvedLine(fieldY: number) {
        for (let i = 0; i < this.greyLines.length; i++) {
            if (this.greyLines[i] == fieldY) {
                this.greyLines.splice(i, 1);
            }
        }

        this.sendUpdateLinesMessage();
        this.lineCounter++
        this.sendUpdateCounterMessage(this.lineCounter);




        for (let y = fieldY; y > 0; y--) {
            for (let x = 1; x < this.fieldNumberArray.length - 1; x++) {
                this.fieldNumberArray[x][y] = this.fieldNumberArray[x][y - 1];
            }
        }

        //Reihe ganz oben mit Nullern füllen, da sie nicht "mitverschoben" werden kann 
        for (let i = 0; i < this.fieldNumberArray.length; i++) {
            this.fieldNumberArray[i][0] = 0
        }
        this.updateField()
    }
    solvedLineHasBeenMoved(y: number) {
        if (!this.solvedLinesToRemove.some(element => element == y + 5)) {
            this.solvedLinesToRemove.push(y + 5);
            this.solvedLinesToRemove.sort();
        }

    }

    sendUpdateCounterMessage(lineCounter: number) {
        if (this.updateBoolean) {
            let suc: ServerMessageUpdateCounter = {
                id: "updateCounter",
                lineCounter: lineCounter
            }
            this.clientData.socket.send(JSON.stringify(suc));

        }
    }


    lineSent() {
        this.lineHasBeenSent = true;
    }

    addLineAtBottom() {
        for (let y = 0; y < 24; y++) {
            for (let x = 1; x < this.fieldNumberArray.length - 1; x++) {
                this.fieldNumberArray[x][y] = this.fieldNumberArray[x][y + 1];
            }
        }
        for (let x = 1; x < this.fieldNumberArray.length - 1; x++) {
            this.fieldNumberArray[x][24] = 8;
        }
        if (Math.random() <= 1) {
            this.fieldNumberArray[this.lastFreeHoleAtGreyLine][24] = 0;
        }
        else {
            let hole = Math.ceil(Math.random() * 10)
            this.fieldNumberArray[hole][24] = 0;
            this.lastFreeHoleAtGreyLine = hole;
        }
        this.updateField()
    }

    updateField() {
        if (this.updateBoolean) {
            this.sendGenerateFieldMessage(this.fieldNumberArray);
        }
    }

    sendGenerateFieldMessage(fieldArray: number[][]) {
        if (this.updateBoolean) {
            let snf: ServerMessageNewField = {
                id: "newField",
                newField: fieldArray,
                player: this.server.nameIDDatafy(this.clientData)
            };
            this.clientData.socket.send(JSON.stringify(snf));
            this.server.sendToMembers(snf, this.clientData);
        }
    }

    createTestField() {
        this.fieldNumberArray = [
            [0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 3, 2, 1, 1, 1, 1, -1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 3, 2, 1, 1, 0, 1, -1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 2, 1, 1, 1, 1, -1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 3, 2, 1, 1, 1, 1, -1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 2, 1, 1, 1, 1, -1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, -1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 2, 1, 1, 1, 1, -1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 3, 2, 1, 1, 1, 1, -1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 3, 2, 1, 1, 1, 0, -1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 3, 2, 1, 1, 1, 1, -1],
            [0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]
        ]
        this.updateField()
    }

    setStartField() {
        this.fieldNumberArray = [];
        for (let x = 0; x <= 11; x++) {
            this.fieldNumberArray[x] = [];
            for (let y = 0; y <= 25; y++) {
                if (x == 0 || x == 11 || y == 25) {
                    this.fieldNumberArray[x][y] = -1
                }
                else {
                    this.fieldNumberArray[x][y] = 0;
                }
            }
        }
    }
}