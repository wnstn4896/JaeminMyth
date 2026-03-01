export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        const basePath = window.location.pathname.replace(/\/[^\/]*$/, '');
        const images = `${basePath}/assets/images`;
        const sounds = `${basePath}/assets/sounds`;
        const msg = `${basePath}/src/msgs`;

        for (let i = 1; i <= 8; i++)
            this.load.image('title' + i, `${images}/title` + i + '.png');
        this.load.image('title_sponsor', `${images}/title_sponsor.png`);

        this.load.image('background', `${images}/background.png`);
        this.load.image('loading', `${images}/loading.png`);
        this.load.image('adc_lectureroom', `${images}/adc_lectureroom.png`);
        this.load.image('adc_lectureroom_broken', `${images}/adc_lectureroom_broken.png`);

        this.load.image('Jaemin_front', `${images}/Jaemin_front.png`);
        this.load.image('Jaeminsuki', `${images}/Jaeminsuki.png`);

        this.load.image('jaemin', `${images}/jaemin.png`);
        this.load.image('jaemin', `${images}/jjokbarisuki.png`);
        this.load.image('jjokbarisuki', `${images}/jjokbarisuki.png`);

        this.load.image('stone', `${images}/stone.png`);
        this.load.image('stone_temp', `${images}/stone_temp.png`);
        this.load.image('stone_bullet', `${images}/stone_bullet.png`);
        this.load.image('Laser', `${images}/Laser.png`);

        this.load.image('bullet', `${images}/bullet.png`);
        this.load.image('junsusuki_bullet', `${images}/junsusuki_bullet.png`);

        this.load.image('heart', `${images}/heart.png`);

        for (let i=1; i<=7; i++)
            this.load.image('Jaemin_MTE' + i, `${images}/Jaemin_MTE` + i + '.png');
        for (let i=1; i<=3; i++)
            this.load.image('Jaemin_Run' + i, `${images}/Jaemin_Run` + i + '.png');

        this.load.image('gameover', `${images}/gameover.png`);

        this.load.audio('Jaemin_laugh', [`${sounds}/Jaemin_laugh.m4a`]);
        this.load.audio('sponsor', [`${sounds}/sponsor.m4a`]);
        this.load.audio('sfx_damage', [`${sounds}/sfx_damage.m4a`]);
        this.load.audio('sfx_ZA', [`${sounds}/sfx_ZA.m4a`]);
        this.load.audio('sfx_Bomb', [`${sounds}/sfx_Bomb.wav`]);
        this.load.audio('PrologueBGM', [`${sounds}/PrologueBGM.mp3`]);
        this.load.audio('ROKA', [`${sounds}/ROKA.mp3`]);
        this.load.audio('esaka', [`${sounds}/esaka.mp3`]);
        this.load.audio('MTEWorld', [`${sounds}/MTEWorld.mp3`]);

        this.load.video('Jaemin_buriburi', `${images}/Jaemin_buriburi.mp4`, 'loadeddata', false, true);
        this.load.video('Jaeminsuki_buriburi', `${images}/Jaeminsuki_buriburi.mp4`, 'loadeddata', false, true);
        this.load.video('Jaemin_Appear', `${images}/Jaemin_Appear.mp4`, 'loadeddata', false, true);
        this.load.video('toongsil', `${images}/toongsil.mp4`, 'loadeddata', false, true);
        this.load.video('chosun', `${images}/chosun.mp4`, 'loadeddata', false, true);
        this.load.video('Kazachok', `${images}/Kazachok.mp4`, 'loadeddata', false, true);

        this.load.json('PrologueDialogues', `${msg}/Prologue.json`);
    }

    create() {
        this.scene.start('TitleScene');
    }
}


