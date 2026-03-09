export class NigerundayoScene extends Phaser.Scene {
    constructor() {
        super({ key: 'NigerundayoScene' });

    }

    create() {
        const video = this.add.video(640, 360, 'Nigerundayo');

        video.setMute(false);
        video.play();

        video.on('complete', () => {
            this.scene.start('LoadingScene', { goToStage: 4 });
        });
    }
}
