export class StageSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StageSelectScene' });
        this.player;
        this.spaceKey;

        // 월드맵 간 이동 관련
        this.isAutoMove = false;
        this.targetX = null;
        this.targetY = null;
        this.autoSpeed = 360;

        // 스테이지 선택 관련
        this.select = 0;
        this.stage;
        this.stageClear = Number(sessionStorage.getItem("stageClear")) || 0;
        this.isBtnPressed;
    }

    create() {
        this.background = this.add.tileSprite(640, 360, 1280, 720, 'background');
        this.physics.world.setBounds(-70, 0, 1430, 600); // 월드 경계 설정

        this.background = this.add.video(360, 370, 'TaekwonV_Jaemin');
        this.background.setScale(2.1);
        this.background.setLoop(true);
        this.background.play(true);

        // 스테이지 선택 텍스트
        const noticeText = this.add.text(640, 80, 'CHOOSE A STAGE', {
            fontSize: '48px',
            color: '#FFD700', // 금색
            fontFamily: 'HeirofLightBold',
            stroke: '#000000', // 검정색 외곽선
            strokeThickness: 5, // 외곽선 두께
        }).setOrigin(0.5, 0.5).setInteractive();
        this.stageText = this.add.text(640, 140, '', {
            fontSize: '36px',
            color: '#C0C0C0',  // 은색
            fontFamily: 'HeirofLightBold',
            stroke: '#000000', // 검정색 외곽선
            strokeThickness: 3, // 외곽선 두께
        }).setOrigin(0.5, 0.5).setInteractive();

        // 선택 버튼
        this.Button = this.add.tileSprite(740, this.stageText.y + this.stageText.height / 2 + 60, 280, 120, 'select_btn').setOrigin(1.0, 0.5).setInteractive();
        this.Button.setScale(0.7);
        this.Button.on('pointerdown', () => this.isBtnPressed = true);
        this.Button.on('pointerup', () => this.isBtnPressed = false);
        this.Button.on('pointerout', () => this.isBtnPressed = false);
        this.Button.setVisible(false);

        // 스프라이트 시트 없이 개별 이미지를 애니메이션으로 구성
        const walkFrames = [];
        for (let i = 1; i <= 3; i++)
            walkFrames.push({ key: 'Jaemin_Run' + i });

        // 애니메이션 정의
        this.anims.create({
            key: 'walk',
            frames: walkFrames,
            frameRate: 12,
            repeat: -1
        });

        this.defaultIcon = this.add.sprite(100, 400, 'stone_head').setInteractive();
        this.defaultIcon.on('pointerdown', () => {
            this.startAutoMove(this.defaultIcon.x, this.defaultIcon.y);
            this.select = 0;
        });
        this.defaultIcon.setScale(0.5);

        if (this.stageClear >= 1){
            this.stage1Icon = this.add.sprite(300, 400, 'jjokbarisuki_head').setInteractive();
            this.stage1Icon.on('pointerdown', () => {
                this.startAutoMove(this.stage1Icon.x, this.stage1Icon.y);
                this.select = 1;
            });
            this.stage1Icon.setScale(0.5);
        }

        if (this.stageClear >= 2){
            this.stage2Icon = this.add.sprite(500, 400, 'junsusuki_head').setInteractive();
            this.stage2Icon.on('pointerdown', () => {
                this.startAutoMove(this.stage2Icon.x, this.stage2Icon.y);
                this.select = 2;
            });
            this.stage2Icon.setScale(0.5);
        }

        if (this.stageClear >= 3){
            this.stage3Icon = this.add.sprite(700, 400, 'jaeminsuki_head_black').setInteractive();
            this.stage3Icon.on('pointerdown', () => {
                this.startAutoMove(this.stage3Icon.x, this.stage3Icon.y);
                this.select = 3;
            });
            this.stage3Icon.setScale(0.5);
        }

        // 기본 스프라이트 설정
        this.player = this.physics.add.sprite(100, 300, 'Jaemin_Run1');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.4);
        this.player.setFlipX(true);

        // 키보드 입력
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.bgm = this.sound.add('TaekwonV', { loop: true });
        this.bgm.setVolume(0.4).play();

        this.selectSFX = this.sound.add('sfx_choonjat');
    }

    startAutoMove(x, y) {
        this.targetX = x;
        this.targetY = y;
        this.isAutoMove = true;

        // 방향 바라보기
        if (this.targetX > this.player.x) 
            this.player.setFlipX(true);
        else
            this.player.setFlipX(false);

        this.player.anims.play('walk', true);
    }

    update(time, delta) {
        if (this.isAutoMove) {
            let dx = this.targetX - this.player.x;
            let dy = this.targetY - this.player.y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 5) {
                // 도착
                this.player.setVelocity(0, 0);

                this.player.anims.stop();

                this.player.setTexture("Jaemin_Run1");

                this.isAutoMove = false;

                this.Button.setVisible(true);

                switch (this.select) {
                    case 0:
                        this.stageText.setText("Stage 1");
                        this.stage = 1;
                        break;
                    case 1:
                        this.stageText.setText("Stage 2");
                        this.stage = 2;
                        break;
                    case 2:
                        this.stageText.setText("Stage 3");
                        this.stage = 3;
                        break;
                    case 3:
                        this.stageText.setText("Final Stage");
                        this.stage = 4;
                        break;
                }

                return;
            }

            let nx = dx / dist;
            let ny = dy / dist;

            this.player.setVelocity(nx * this.autoSpeed, ny * this.autoSpeed);

            if (nx > 0) {
                this.player.setFlipX(true);
            } else {
                this.player.setFlipX(false);
            }

            if (!this.player.anims.isPlaying) {
                this.player.anims.play("walk", true);
            }

            return;
        }

        this.player.setVelocity(0, 0);

        // 목적지 도착 후 선택 키 입력 시 해당 씬으로 전환
        if ((this.isBtnPressed || this.spaceKey.isDown)){
            this.bgm.stop();
            this.selectSFX.play();
            this.scene.start('LoadingScene', { goToStage: this.stage });
        }
    }
}
