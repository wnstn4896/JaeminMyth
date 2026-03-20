export class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
        this.player;
        this.spaceKey;

        // 월드맵 간 이동 관련
        this.isAutoMove = false;
        this.targetX = null;
        this.targetY = null;
        this.autoSpeed = 360;
    }

    init(data) {
        this.goToStage = data.goToStage;
    }

    create() {
        this.background = this.add.tileSprite(640, 360, 1280, 720, 'loading');
        this.physics.world.setBounds(-70, 0, 1430, 600); // 월드 경계 설정

        // 스프라이트 시트 없이 개별 이미지를 애니메이션으로 구성
        const walkFrames = [];
        for (let i = 1; i <= 3; i++)
            walkFrames.push({ key: 'Jaemin_Run' + i });

        // 애니메이션 정의
        this.anims.create({
            key: 'walk',
            frames: walkFrames,
            frameRate: 10,
            repeat: -1
        });

        // 기본 스프라이트 설정
        this.player = this.physics.add.sprite(150, 250, 'Jaemin_Run1');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.4);
        this.player.setFlipX(true);

        this.loadingBar = this.add.graphics();
        this.loadingBar.setScrollFactor(0); // ✅ 화면 고정

        this.startX = 150;
        this.endX = 999;

        this.barWidth = 400;
        this.barHeight = 20;

        this.barX = (this.scale.width - this.barWidth) / 2;
        this.barY = 150;
    }

    update(time, delta) {
        this.player.anims.play("walk", true);
        this.player.setVelocityX(180);

        let progress = Phaser.Math.Clamp(
            (this.player.x - this.startX) / (this.endX - this.startX),
            0,
            1
        );

        this.loadingBar.clear();

        // 흰색 테두리
        this.loadingBar.lineStyle(3, 0xffffff);
        this.loadingBar.strokeRect(this.barX, this.barY, this.barWidth, this.barHeight);

        // 초록색 내부 바
        this.loadingBar.fillStyle(0x00ff00);
        this.loadingBar.fillRect(
            this.barX,
            this.barY,
            this.barWidth * progress,
            this.barHeight
        );

        if (this.player.x >= 999){
            switch(this.goToStage){
                case 1:
                    this.scene.start('Stage1BattleScene');
                    break;
                case 2:
                    this.scene.start('Stage2BattleScene');
                    break;
                case 3:
                    this.scene.start('Stage3BattleScene');
                    break;
                case 4:
                    this.scene.start('Stage4BattleScene');
                    break;
                case 'FakeBossScene':
                    this.scene.start('FakeBossScene');
                    break;
                case 'CreditsScene':
                    this.scene.start('CreditsScene');
                    break;
                default:
                    alert('오류.');
                    return;
            }
        }
    }
}
