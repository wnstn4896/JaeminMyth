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

        // "게임 시작" 버튼 텍스트
        const startText = this.add.text(650, 500, '게임 시작', {
            fontSize: '48px',
            fontFamily: 'HeirofLightBold',
            color: '#FFD700', // 기본 금색
            stroke: '#000000', // 검정색 외곽선
            strokeThickness: 5, // 외곽선 두께
        }).setOrigin(0.5, 0.5).setInteractive();

        this.time.delayedCall(700, () => {
            this.cameras.main.flash(3000, 0, 0, 0);
            this.title.anims.play('title', true);
        });

        // 텍스트 등장 애니메이션
        startText.setAlpha(0);
        startText.setVisible(false);

        this.time.delayedCall(1950, () => {
            startText.setVisible(true);
        });

        this.tweens.add({
            targets: startText,
            alpha: 1,
            duration: 1000, // 1초 동안 서서히 등장
            ease: 'Power2', // 애니메이션 타입
        });

        // 호버 이벤트 (마우스 오버)
        startText.on('pointerover', () => {
            startText.setStyle({
                color: '#C0C0C0', // 은색
                fontStyle: 'bold',
            });
            // 텍스트 크기 애니메이션
            this.tweens.add({
                targets: startText,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 300,
                ease: 'Power2',
            });
        });

        // 마우스 아웃 이벤트
        startText.on('pointerout', () => {
            startText.setStyle({
                color: '#FFD700', // 금색
                fontStyle: 'normal',
            });
            // 텍스트 크기 애니메이션 되돌리기
            this.tweens.add({
                targets: startText,
                scaleX: 1,
                scaleY: 1,
                duration: 300,
                ease: 'Power2',
            });
        });

        // 클릭 이벤트
        startText.on('pointerdown', () => {
            startText.setStyle({
                color: '#B8860B', // 어두운 금색
            });
            this.scene.start('Stage1BattleScene');
        });

        // 클릭 후 텍스트 색상 원래대로 되돌리기
        startText.on('pointerup', () => {
            startText.setStyle({
                color: '#FFD700', // 기본 금색
            });
        });

        // 텍스트에 그림자 효과
        startText.setShadow(3, 3, '#000000', 2, false, true);
    }
}
