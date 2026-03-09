export class VideoCutScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VideoCutScene' });

    }

    init(data) {
        this.videoSrc = data.videoSrc;
    }


    create() {
        const video = this.add.video(640, 360, this.videoSrc);

        video.setMute(false);
        video.play();

        video.on('complete', () => {
            this.scene.start('LoadingScene', { goToStage: 4 });
        });
    }
}
