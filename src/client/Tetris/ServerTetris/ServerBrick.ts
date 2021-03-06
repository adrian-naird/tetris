import { ServerField } from "./ServerField.js";
export class Brick {

    public stones: boolean[][];
    stoneContainer: boolean[][];
    public updateBoolean: boolean = true;
    xC: number;
    yC: number;
    rlcounter: number = 0;
    downCounter: number = 0;
    counter: number = 0;
    interval: NodeJS.Timeout;
    left: boolean = false;
    right: boolean = false;
    down: boolean = false;
    shadowBrick: Brick;
    shadowBrickUpdated: boolean = false;

    constructor(public field: ServerField, public id: number) {
        this.xC = 4;
        this.yC = -3;

        switch (id) {
            case 1:
                this.stones = [
                    [false, false, false, false],
                    [false, true, true, false],
                    [false, true, true, false],
                    [false, false, false, false]
                ]
                break;
            case 2:
                this.stones = [
                    [false, true, false],
                    [true, true, false],
                    [true, false, false],
                ]
                break;
            case 3:
                this.stones = [
                    [false, false, false],
                    [true, true, true],
                    [false, false, true],
                ]
                break;
            case 4:
                this.stones = [
                    [false, false, false, false],
                    [false, false, false, false],
                    [true, true, true, true],
                    [false, false, false, false]
                ]
                break;
            case 5:
                this.stones = [
                    [false, false, true],
                    [true, true, true],
                    [false, false, false],

                ]
                break;
            case 6:
                this.stones = [
                    [false, false, false],
                    [false, true, true],
                    [true, true, false],
                ]
                break;
            case 7:
                this.stones = [
                    [false, true, false],
                    [true, true, false],
                    [false, true, false],
                ]
                break;
        }
        this.field.holdBrickAlreadyChangedOnce = false;
        this.interval = setInterval(() => { this.update() }, 33.3333333)
    }

    rKeypushed() {
        if (this.updateBoolean && this.field.updateBoolean) {
            this.brickRotation();
        }
    }

    fKeyPushed() {
        if (this.updateBoolean && this.field.updateBoolean) {
            this.moveDownToBottom();
        }
    }
    /**
     * Die Methode ??berpr??ft ob die Bewegung an die Koordinaten xC/yC
     * zu ??berschneidungen mit dem restlichen Feld f??hren w??rde.
     * @param xC Die zu ??berpr??fende x-Koordinate
     * @param yC Die zu ??berpr??fende y-Koordinate
     * @returns true, wenn die zu ??berpr??fende Bewegung valide ist, false wenn nicht
     */
    isValidMove(xC: number, yC: number): boolean {
        for (let y = 0; y < this.stones.length; y++) {
            for (let x = 0; x < this.stones.length; x++) {
                if (this.stones[x][y] && this.field.fieldNumberArray[x + xC + 1][y + yC + 5] != 0) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Die Methode ??berpr??ft ob eine Rotation zu ??berschneidungen 
     * mit dem restlichen Feld f??hren w??rde.
     * @returns true, wenn der Brick rotiert werden kann, false wenn nicht
     */
    isRotatable(): boolean {
        let testArray = this.rotateMatrix(this.stones);

        for (let y = 0; y < this.stones.length; y++) {
            for (let x = 0; x < this.stones.length; x++) {

                if (testArray[x][y] && this.field.fieldNumberArray[x + this.xC + 1][y + this.yC + 5] != 0) {
                    return false;
                }
            }
        }
        return true;
    }

    moveDown() {
        if (this.isValidMove(this.xC, this.yC + 1)) {
            this.yC++;
            this.field.sendGenerateFieldMessage(this.field.createCurrentFieldArray());
        }
        else {
            this.field.destroyBrick();
            this.field.sendGenerateFieldMessage(this.field.createCurrentFieldArray());
        }
    }

    moveRight() {
        if (this.isValidMove(this.xC + 1, this.yC)) {
            this.xC++;
            this.field.sendGenerateFieldMessage(this.field.createCurrentFieldArray());
            this.updateShadowBrick();

        }
    }
    moveLeft() {
        if (this.isValidMove(this.xC - 1, this.yC)) {
            this.xC--;
            this.field.sendGenerateFieldMessage(this.field.createCurrentFieldArray());
            this.updateShadowBrick();
        }
    }

    rotateBrick() {
        if (this.isRotatable() && this.field.updateBoolean) {
            // da this.rotateMatrix gegen den Uhrzeigersinn rotiert, lasse ich es einfach drei mal hintereinander aufrufen
            // damit es im Uhrzeigersinn rotiert. 
            for (let i = 0; i < 3; i++) {
                this.stoneContainer = this.stones;
                this.stones = this.rotateMatrix(this.stoneContainer);
            }
            this.field.sendGenerateFieldMessage(this.field.createCurrentFieldArray());
            this.updateShadowBrick();
        }
    }

    // see: https://www.jsmount.com/javascript-rotate-2d-matrix-90-degrees-clockwise/ 
    rotateMatrix(matrix: boolean[][]): boolean[][] {
        // Create a deep copy of 2d array first
        let rotateArr = matrix.map((a) => a.slice());
        const n = rotateArr.length;
        const x = Math.floor(n / 2);
        const y = n - 1;
        for (let i = 0; i < x; i++) {
            for (let j = i; j < y - i; j++) {
                const k = rotateArr[i][j]; // put first value in temp variable
                rotateArr[i][j] = rotateArr[y - j][i];
                rotateArr[y - j][i] = rotateArr[y - i][y - j];
                rotateArr[y - i][y - j] = rotateArr[j][y - i];
                rotateArr[j][y - i] = k;
            }
        }
        return rotateArr;
    }

    update() {
        if (this.updateBoolean && this.field.updateBoolean && !this.field.waitForAnimation) {
            this.rlcounter++;
            this.rlcounter++;
            this.downCounter++;


            if (this.counter + 150 < Date.now()) {
                this.moveDown();
                this.counter = Date.now();
                if (!this.shadowBrickUpdated) {
                    this.updateShadowBrick();
                    this.shadowBrickUpdated = true;
                }
            }

            if (this.left) {
                if (this.rlcounter > 5) {
                    this.moveLeft();
                    this.rlcounter = 0;
                }
            }

            else if (this.right) {
                if (this.rlcounter > 5) {
                    this.moveRight();
                    this.rlcounter = 0;
                }
            }

            if (this.down) {
                if (this.downCounter > 5) {
                    this.moveDown();
                }
            }
        }
    }


    moveDownToBottom() {
        while (this.isValidMove(this.xC, this.yC + 1)) {
            this.moveDown();
        }
    }
    /**
     * Die Methode versucht m??glichst eine Rotation des Steins auszuf??hren,
     * auch wenn dies durch eine Wand eigentlich nicht m??glich sein sollte.
     * In diesem Fall wird der Stein ein St??ck von der Wand wegbewegt und dann rotiert.
     */
    brickRotation() {
        if (this.id == 4) {
            // Wenn Stein Nr.4 ung??nstig gedreht ist, und links an der Wand ist,
            //  betr??gt sein xC wert -2, was in den aufgerufenen Methoden, zu dem Aufruf eines [-1] Feldes in field[][]f??hrt
            if (this.xC == -2) {
                this.moveRight();
                this.moveRight();
                this.rotateBrick();
            }
            // Wenn sich der Stein drehen kann soll er das tun
            else if (this.isRotatable()) {
                this.rotateBrick();
            }

            else {
                // Wenn sich der Stein nicht drehen konnte:

                // Wenn er sich nicht nach links bewegen kann, soll er sich nach zwei mal nach rechts bewegen und dann rotieren
                // und dann wieder zwei mal nach links   
                if (!this.isValidMove(this.xC - 1, this.yC)) {
                    this.moveRight();
                    this.rotateBrick();
                    this.moveLeft();
                }
                // Wenn er sich nicht nach rechts bewegen kann, soll er sich zwei mal nach links bewegen, rotieren und dann wieder m??glichst nach rechts 
                else if (!this.isValidMove(this.xC + 1, this.yC)) {
                    this.moveLeft();
                    this.moveLeft();
                    this.rotateBrick();
                    this.moveRight();
                    this.moveRight();
                }

                else {
                    this.moveRight();
                    if (this.isRotatable()) {
                        this.rotateBrick();
                    }
                    else {
                        this.moveLeft();
                        this.moveLeft();
                        this.rotateBrick();
                    }
                }
            }
        }

        //Falls es nicht Stein Nr.4 ist:

        // wenn der Stein rotieren kann, dann soll er das tun
        else if (this.isRotatable()) {
            this.rotateBrick();

        }

        // Wenn er nicht rotieren kann soll er folgendes tun:
        else {

            if (!this.isValidMove(this.xC - 1, this.yC)) {
                this.moveRight();
                this.rotateBrick();
                this.moveLeft();

            }
            else if (!this.isValidMove(this.xC + 1, this.yC)) {
                this.moveLeft();
                this.rotateBrick();
                this.moveRight();

            }
        }
    }
    /**
     * Die Methode berechnet die yC-Koordinate f??r den ShadowBrick
     * @param yC die aktuelle yC-Koordinate des Bricks
     * @returns die yC-Koordinate an welche der ShadowBrick generiert werden soll
     */
    getShadowBrickYPosition(yC: number): number {
        let offset = 0;
        while (this.isValidMove(this.xC, yC + offset)) {
            offset++;
        }
        return offset + yC - 1;
    }

    updateShadowBrick() {
        let sus = {
            id: "updateShadow",
            xC: this.xC,
            yC: this.getShadowBrickYPosition(this.yC),
            stoneID: this.id,
            stones: this.stones
        }
        this.field.clientData.socket.send(JSON.stringify(sus));
    }

    destroy() {
        this.updateBoolean = false;
        this.field.brick = null;
    }

}
