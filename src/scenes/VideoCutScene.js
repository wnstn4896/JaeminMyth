export class VideoCutScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VideoCutScene' });

        this.stage;
    }

    init(data) {
        this.videoSrc = data.videoSrc;
    }


    create() {
        const video = this.add.video(640, 360, this.videoSrc);

        video.setMute(false);
        video.play();

        video.on('complete', () => {
            switch (this.videoSrc) {
                case 'Nigerundayo':
                    this.scene.start('LoadingScene', { goToStage: 'FakeBossScene' });
                    break;
                case 'Diavolo':
                    this.scene.start('Stage4BattleScene');
                    break;
                case 'Jaemin-jaeminsuki_gayjoygo':
                    this.scene.start('LoadingScene', { goToStage: 'CreditsScene' });
                    break;
                case 'junsusuki_keyboard':
                    this.scene.start('HiddenStageScene', { HiddenSceneDone : true });
                    break;
                case 'Jaeminsuki_buriburi':
                    this.bgm = this.sound.add('JoJo_Awaken_part1');
                    this.bgm.setVolume(0.7).play();

                    const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000)
                        .setOrigin(0)
                        .setDepth(999)
                        .setAlpha(0);

                    this.tweens.add({
                        targets: overlay,
                        alpha: 1,
                        duration: 300,
                        ease: 'Power2'
                    });

                    this.bgm.on('complete', () => {
                        this.tweens.add({
                            targets: overlay,
                            alpha: 0,
                            duration: 500,
                            onComplete: () => overlay.destroy()
                        });
                        this.scene.start('Stage5BattleScene');
                    });
                    break;
                case 'gameover':
                    window.location.reload();
                    break;
            }
        });

    }
}
