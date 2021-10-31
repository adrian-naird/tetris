export class NameScene extends Phaser.Scene {
    
    constructor() {
        super({
            key: "NameScene"
        });
    }

    logo: Phaser.GameObjects.Sprite
    enter: Phaser.Input.Keyboard.Key
    element: Phaser.GameObjects.DOMElement
    inputText: any
    logoSize: number = 1;
    scaler: boolean = true;
    count: number

    preload(): void {
        this.count = 0;
        this.load.image('logo', 'assets/sprites/logo.png');
        this.load.image('pointer', 'assets/sprites/pointer.cur');
        this.load.image('typer', 'assets/sprites/typer.cur');
        this.load.html('nameform', 'assets/text/nameform.html');
        this.load.css('main', 'css/main.css');
        this.enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    }
    create(): void {
        this.element = this.add.dom(1920 / 2, 804).createFromCache('nameform');
        this.input.setDefaultCursor('url(assets/sprites/pointer.cur), pointer');
        this.element.setInteractive({
            cursor: 'typer'
        })
        this.logo = new Phaser.GameObjects.Sprite(this, 1000, 422, 'logo');
        this.add.existing(this.logo);
        this.enter.once('down', () => {
            this.inputText = this.element.getChildByName('nameField');
            this.inputText.value;
            this.scene.start('LobbyScene', { givingName: this.inputText.value, nameScene: true});
        })
    }
    update(): void {
        if (this.logoSize <= 0.98) {
            this.scaler = true;
        } else {
            if (this.logoSize >= 1.02) {
                this.scaler = false;
            }
        }
        if (this.scaler) {
            this.logoSize = this.logoSize + 0.001;
        } else {
            this.logoSize = this.logoSize - 0.001;
        }
        this.logo.setScale(this.logoSize);
    }
}