export class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        // 로드된 이미지를 배경으로 추가
        this.title = this.add.tileSprite(640, 360, 1280, 720, 'title');

        // "게임 시작" 버튼 텍스트
        const startText = this.add.text(650, 500, '게임 시작', {
            fontSize: '32px', // 텍스트 크기
            color: '#ffffff',
            fontFamily: 'Arial',
        }).setOrigin(0.5, 0.5).setInteractive(); // 중심 기준으로 정렬 및 상호작용 활성화

        // 클릭 이벤트
        startText.removeAllListeners('pointerdown'); // 기존 리스너 제거
        startText.on('pointerdown', () => {
            this.scene.start('ShooterScene'); // 다음 Scene으로 전환
        });
    }
}
