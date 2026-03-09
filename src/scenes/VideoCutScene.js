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

        switch (this.videoSrc){
            case 'Nigerundayo':
                this.stage = 4;
                break;
        }

        video.setMute(false);
        video.play();

        video.on('complete', () => {
            this.scene.start('LoadingScene', { goToStage: this.stage });
        });
    }
}
