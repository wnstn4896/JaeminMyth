
export class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });

        this.player = null;
        this.spaceKey = null;

        // 월드맵 간 이동 관련
        this.isAutoMove = false;
        this.targetX = null;
        this.targetY = null;
        this.autoSpeed = 360;

        // 씬 전환 중복 실행 방지
        this.isTransitioning = false;

        this.HiddenSceneDone = sessionStorage.getItem("HiddenSceneDone");

        this.hiddenbgm = null;
    }

    init(data) {
        // 전달받은 목적지 저장
        this.goToStage = data?.goToStage;

        // 씬 재진입 시 상태 초기화
        this.isTransitioning = false;
        this.hiddenbgm = null;
    }

    create() {
        // 배경 설정
        this.background = this.add.tileSprite(
            640, 360, 1280, 720, 'loading'
        );

        // 물리 월드 설정
        this.physics.world.setBounds(-70, 0, 1430, 600);

        // 걷기 애니메이션 프레임 설정
        const walkFrames = [];

        for (let i = 1; i <= 3; i++) {
            walkFrames.push({
                key: 'Jaemin_Run' + i
            });
        }

        // 애니메이션이 이미 등록되어 있는지 확인
        if (!this.anims.exists('walk')) {
            this.anims.create({
                key: 'walk',
                frames: walkFrames,
                frameRate: 10,
                repeat: -1
            });
        }

        // 플레이어 생성
        this.player = this.physics.add.sprite(
            150, 250, 'Jaemin_Run1'
        );

        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.4);
        this.player.setFlipX(true);

        // 로딩 바 설정
        this.loadingBar = this.add.graphics();
        this.loadingBar.setScrollFactor(0);

        this.startX = 150;
        this.endX = 999;

        this.barWidth = 400;
        this.barHeight = 20;

        this.barX = (this.scale.width - this.barWidth) / 2;
        this.barY = 150;

        // 초기 로딩 바 표시
        this.drawLoadingBar(0);
    }

    update(time, delta) {
        // 씬 전환 중에는 이동 로직을 실행하지 않음
        if (this.isTransitioning) {
            return;
        }

        // 플레이어가 목표 지점에 도달했는지 확인
        if (this.player.x >= this.endX) {
            this.player.setX(this.endX);
            this.player.setVelocity(0, 0);
            this.player.anims.stop();

            // 로딩 바를 100%로 표시
            this.drawLoadingBar(1);

            // 씬 전환은 한 번만 실행
            this.isTransitioning = true;

            this.transitionToNextScene();
            return;
        }

        // 플레이어 이동 및 애니메이션
        this.player.anims.play('walk', true);
        this.player.setVelocityX(180);

        // 이동 거리를 기준으로 진행도 계산
        const progress = Phaser.Math.Clamp(
            (this.player.x - this.startX) /
            (this.endX - this.startX),
            0,
            1
        );

        this.drawLoadingBar(progress);
    }

    // 로딩 바 그리기
    drawLoadingBar(progress) {
        this.loadingBar.clear();

        // 흰색 테두리
        this.loadingBar.lineStyle(3, 0xffffff);
        this.loadingBar.strokeRect(
            this.barX,
            this.barY,
            this.barWidth,
            this.barHeight
        );

        // 초록색 진행 바
        this.loadingBar.fillStyle(0x00ff00);
        this.loadingBar.fillRect(
            this.barX,
            this.barY,
            this.barWidth * progress,
            this.barHeight
        );
    }

    // 목적지에 따른 씬 전환
    transitionToNextScene() {
        // 숫자와 문자열로 전달되는 스테이지 번호 모두 처리
        const stage = this.goToStage;

        switch (stage) {
            case 1:
            case '1':
                this.scene.start('Stage1BattleScene');
                break;

            case 2:
            case '2':
                this.scene.start('Stage2BattleScene');
                break;

            case 3:
            case '3':
                this.scene.start('Stage3BattleScene');
                break;

            case 4:
            case '4':
                this.scene.start('Stage4BattleScene');
                break;

            case 'FakeBossScene':
                this.scene.start('FakeBossScene');
                break;

            case 'CreditsScene':
                this.scene.start('CreditsScene');
                break;

            case 'HiddenStageScene':
                this.scene.start('HiddenStageScene');
                break;

            case 5:
            case '5': {
                const isHiddenSceneDone =
                    this.HiddenSceneDone === 'true' ||
                    this.HiddenSceneDone === '1';

                if (isHiddenSceneDone) {
                    // 숨겨진 씬 완료: BGM + 암전 후 전환
                    this.transitionToStage5();
                } else {
                    // 미완료: 바로 스테이지 5로 전환
                    this.scene.start('Stage5BattleScene');
                }
                break;
            }

            default:
                console.error(
                    '[LoadingScene] 알 수 없는 목적지:',
                    stage,
                    '| 타입:',
                    typeof stage
                );

                // 잘못된 값으로 인해 로딩 화면에 영구적으로
                // 머무르지 않도록 전환 상태를 초기화
                this.isTransitioning = false;
                this.player.setVelocity(0, 0);
                this.player.anims.stop();
                break;
        }
    }

    // 스테이지 5 전용 전환 처리
    transitionToStage5() {
        // 중복 실행 방지
        if (this.isTransitioning === false) {
            this.isTransitioning = true;
        }

        // 검은 화면 오버레이 생성
        const overlay = this.add.rectangle(
            0,
            0,
            this.scale.width,
            this.scale.height,
            0x000000
        )
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(999)
            .setAlpha(0);

        // BGM 생성
        this.hiddenbgm = this.sound.add('JoJo_Awaken_part1', {
            volume: 0.4,
            loop: false
        });

        // BGM 재생이 끝나면 스테이지 전환
        this.hiddenbgm.once('complete', () => {
            if (!this.scene.isActive()) {
                return;
            }

            this.scene.start('Stage5BattleScene');
        });

        // BGM 재생 시작
        this.hiddenbgm.play();

        // BGM 재생과 동시에 화면 암전
        this.tweens.add({
            targets: overlay,
            alpha: 1,
            duration: 1500,
            ease: 'Power2'
        });
    }
}
