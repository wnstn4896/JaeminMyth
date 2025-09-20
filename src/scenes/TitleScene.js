export class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        // 로드된 이미지를 배경으로 추가
        this.title = this.physics.add.sprite(640, 350, 'title1');

        // 애니메이션 프레임 처리
        const titleFrames = [];
        for (let i=1; i <= 8; i++)
            titleFrames.push({ key: 'title' + i });

        this.anims.create({
            key: 'title',
            frames: titleFrames,
            frameRate: 7,
            repeat: 0
        });

        this.time.delayedCall(700, () => {
            this.cameras.main.flash(3000, 0, 0, 0);
            this.title.anims.play('title', true);
        });

        // "게임 시작" 버튼 텍스트
        const startText = this.add.text(650, 500, '게임 시작', {
            fontSize: '32px', // 텍스트 크기
            color: '#ffffff',
            fontFamily: 'Arial',
        }).setOrigin(0.5, 0.5).setInteractive(); // 중심 기준으로 정렬 및 상호작용 활성화

        // 클릭 이벤트
        startText.removeAllListeners('pointerdown'); // 기존 리스너 제거
        startText.on('pointerdown', () => {
            this.scene.start('Stage1BattleScene'); // 다음 Scene으로 전환
        });
    }
}
