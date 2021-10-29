export class Logo extends Phaser.Physics.Arcade.Sprite {
    constructor(scene: Phaser.Scene, y: number) {
        super(scene, -100, y, "ScrollingLogo")
        this.setOrigin(0, 0)
        scene.add.existing(this);
        //722,318
        //672,318
    }
}

export class ScrollingLogos {

    public logo1: Logo;
    public logo2: Logo;
    public logo3: Logo;

    scene: Phaser.Scene
    logos: Phaser.Physics.Arcade.Group;

    constructor(scene: Phaser.Scene) {
        let that = this;
        this.scene = scene;
        scene.events.on('update', (time: number, delta: number) => {
            that.update(time, delta);
        })
        this.logos = new Phaser.Physics.Arcade.Group(this.scene.physics.world, this.scene);

        this.logo1 = new Logo(scene, 0);
        this.logo2 = new Logo(scene, 452);
        this.logo3 = new Logo(scene, -452);
        this.logos.addMultiple([this.logo1, this.logo2, this.logo3]);
    }

    update(time: number, delta: number) {
        this.logos.incY(1);

        if (this.logo1.y > 452 * 2) {
            this.logo1.setPosition(this.logo1.x, -452)
        }
        if (this.logo2.y > 452 * 2) {
            this.logo2.setPosition(this.logo2.x, -452)
        }
        if (this.logo3.y > 452 * 2) {
            this.logo3.setPosition(this.logo3.x, -452)
        }
    }
    
}