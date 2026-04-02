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
                    this.scene.start('Stage5BattleScene');
                    break;
            }
        });

    }
}
