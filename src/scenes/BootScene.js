export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        const basePath = window.location.pathname.replace(/\/[^\/]*$/, '');
        this.load.image('title', `${basePath}/assets/images/title.png`);
        this.load.image('background', `${basePath}/assets/images/background.png`);

        this.load.image('jaemin', `${basePath}/assets/images/jaemin.png`);
        this.load.image('junsusuki', `${basePath}/assets/images/junsusuki.png`);

        this.load.image('stone', `${basePath}/assets/images/stone.png`);
        this.load.image('stone_bullets', `${basePath}/assets/images/stone_bullets.png`);
        this.load.image('stone_bullets_eyes', `${basePath}/assets/images/stone_bullets_eyes.png`);

        this.load.image('bullet', `${basePath}/assets/images/bullet.png`);
        this.load.image('junsusuki_bullet', `${basePath}/assets/images/junsusuki_bullet.png`);

        this.load.image('gameover', `${basePath}/assets/images/gameover.png`);

        this.load.audio('Jaemin_laugh', [`${basePath}/assets/sounds/Jaemin_laugh.m4a`]);
    }

    create() {
        this.scene.start('TitleScene');
    }
}


