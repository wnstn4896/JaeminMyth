export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        const basePath = window.location.pathname.replace(/\/[^\/]*$/, '');

        for (let i = 1; i <= 8; i++)
            this.load.image('title' + i, `${basePath}/assets/images/title` + i + '.png');

        this.load.image('background', `${basePath}/assets/images/background.png`);

        this.load.image('jaemin', `${basePath}/assets/images/jaemin.png`);
        this.load.image('junsusuki', `${basePath}/assets/images/junsusuki.png`);

        this.load.image('stone', `${basePath}/assets/images/stone.png`);
        this.load.image('stone_bullet', `${basePath}/assets/images/stone_bullet.png`);

        this.load.image('bullet', `${basePath}/assets/images/bullet.png`);
        this.load.image('junsusuki_bullet', `${basePath}/assets/images/junsusuki_bullet.png`);

        this.load.image('gameover', `${basePath}/assets/images/gameover.png`);

        this.load.audio('Jaemin_laugh', [`${basePath}/assets/sounds/Jaemin_laugh.m4a`]);

        this.load.video('Jaemin_Appear', `${basePath}/assets/images/Jaemin_Appear.mp4`, 'loadeddata', false, true);
        this.load.video('toongsil', `${basePath}/assets/images/toongsil.mp4`, 'loadeddata', false, true);
    }

    create() {
        this.scene.start('TitleScene');
    }
}


