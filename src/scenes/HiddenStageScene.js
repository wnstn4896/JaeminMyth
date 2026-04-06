import { MessageModule } from './MessageModule.js';

export class HiddenStageScene extends Phaser.Scene {
    constructor() {
        super('HiddenStageScene');
        this.enemyHP = 500;  // 적 체력
        this.shiftKey;

        this.maxHP = 5; // 최대 HP
        this.playerHP = 5; // 현재 HP
        this.isInvincible = false;
        this.invincibleDuration = 1000; // 피격 시 무적 시간

        this.skillWave = null;
        this.isSkillActive = false;
        this.maxBombs = 3;
        this.currentBombs = 3;

        this.bombDelay = 800;
        this.canUseBomb = true;

        this.bombIcons = [];

        this.isClear = false;
    }

    init(data) {
        if (data && data.HiddenSceneDone)
            this.HiddenSceneDone = true;
        else
            this.HiddenSceneDone = false;
    }

    create() {
        // 배경 설정
        this.backgroundUI = this.add.tileSprite(640, 360, 1280, 720, 'background_black'); // 배경 UI

        this.physics.world.setBounds(0, 0, 790, 720); // 월드 경계 설정

        // 플레이어 생성
        this.player = this.physics.add.sprite(380, 600, 'jaemin');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.15);

        // 피탄 판정 히트박스 생성
        this.playerHitbox = this.add.circle(this.player.x, this.player.y, 5, 0xffffff);
        this.physics.add.existing(this.playerHitbox, false);

        // 히트박스 테두리 생성
        this.playerHitboxBorder = this.add.graphics();
        this.playerHitboxBorder.lineStyle(1, 0xffffff);
        this.playerHitboxBorder.strokeCircle(this.player.x, this.player.y, 5);

        // 히트박스와 테두리 동기화
        this.physics.world.on('worldstep', () => {
            this.playerHitboxBorder.clear();
            this.playerHitboxBorder.lineStyle(1, 0xff0000);
            this.playerHitboxBorder.strokeCircle(this.playerHitbox.x, this.playerHitbox.y, 5);
        });

        // 플레이어 HP 아이콘 정의
        this.heartIcons = [];

        for (let i = 0; i < this.maxHP; i++) {
            const heart = this.add.image(970 + i * 25, 120, 'heart_empty');
            heart.setScale(0.8);
            this.heartIcons.push(heart);
        }
        this.updatePlayerHPBar();

        // 스킬(Bomb) 아이콘 생성
        for (let i = 0; i < this.maxBombs; i++) {
            const bomb = this.add.circle(970 + i * 25, 170, 8, 0x009900);
            this.bombIcons.push(bomb);
        }
        this.updateBombUI();

        // 스킬(Bomb) 효과음 정의
        this.bombSFX = this.sound.add('sfx_Bomb', { volume: 0.4 });

        this.sovietSFX = this.sound.add('sfx_CykaBlyat', { volume: 0.3 });

        // 입력 키 설정
        this.cursors = this.input.keyboard.createCursorKeys();

        // 환경 감지: PC인지 모바일인지 확인
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            // 가상 조이스틱 생성
            this.joystickBase = this.add.circle(100, 600, 70, 0x808080, 0.5);
            this.joystickHandle = this.add.circle(100, 600, 30, 0xffffff, 0.8);
            this.input.on('pointerdown', this.startJoystick, this);
            this.input.on('pointermove', this.moveJoystick, this);
            this.input.on('pointerup', this.stopJoystick, this);

            // 발사 버튼 생성
            this.fireButton = this.add.circle(1180, 600, 80, 0xff0000, 0.8).setInteractive(); // 터치 영역 확대
            this.fireButtonText = this.add.text(1180, 600, '발사', {
                font: '20px Arial',
                fill: '#ffffff',
            })
                .setOrigin(0.5); // 텍스트를 버튼의 정 중앙에 배치

            // 발사 버튼 이벤트 처리
            this.fireButton.on('pointerdown', () => {
                this.spaceKeyDown = true;
            });
            this.fireButton.on('pointerup', () => {
                this.spaceKeyDown = false;
            });

            // Bomb 버튼 생성
            this.bombButton = this.add.circle(950, 600, 70, 0x00ffff, 0.9)
                .setInteractive();

            this.bombButtonText = this.add.text(950, 600, 'Bomb', {
                font: '18px Arial',
                fill: '#000000'
            }).setOrigin(0.5);

            // Bomb 버튼 이벤트 처리
            this.bombButton.on('pointerdown', () => {
                this.activateSkill();
            });
        }

        // 플레이어 체력 바
        this.playerHPBar = this.add.graphics();
        this.updatePlayerHPBar(); // 체력 바 초기화

        // 탄막 그룹 설정
        this.playerBullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();

        // 스페이스바 눌림 상태 이벤트 설정
        this.input.keyboard.on('keydown-SPACE', () => {
            this.spaceKeyDown = true;
        });

        this.input.keyboard.on('keyup-SPACE', () => {
            this.spaceKeyDown = false;
        });

        // 탄막 연사 이벤트
        this.time.addEvent({
            delay: 120,
            callback: this.shootPlayerBullet,
            callbackScope: this,
            loop: true,
        });

        // 적 생성
        this.enemies = this.physics.add.group({
            key: 'junsusuki',
            repeat: 0, // 적 1개만 생성
            setXY: { x: 400, y: 100 },
        });

        this.enemies.children.iterate((enemy) => {
            enemy.setScale(0.27);
            enemy.setCollideWorldBounds(true); // 월드 경계 밖으로 못 나가게 설정
            enemy.setBounce(1); // 충돌 시 반전
        });

        // 두 번째 적 생성
        if (this.HiddenSceneDone){
            this.enemies = this.physics.add.group({
                key: 'Jaeminsuki',
                repeat: 0, // 적 1개만 생성
                setXY: { x: 500, y: 100 },
            });

            this.enemies.children.iterate((enemy) => {
                enemy.setScale(0.065);
                enemy.setCollideWorldBounds(true); // 월드 경계 밖으로 못 나가게 설정
                enemy.setBounce(1); // 충돌 시 반전
            });

            this.cameras.main.flash(2000, 0, 0, 0);
        }

        // 텍스트 UI
        this.controlsText = this.add.text(870, 260, '↑↓←→: 이동 | 스페이스바: 탄막 발사 | 쉬프트: 스킬', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'HeirofLightBold',
            padding: { top: 2, bottom: 2 }, // 상단과 하단에 2px 여백 추가
        });

        this.lifeText = this.add.text(850, 100, '잔기 : ', {
            fontSize: '36px',
            fill: '#ffffff',
            fontFamily: 'HeirofLightBold',
            padding: { top: 2, bottom: 2 }, // 상단과 하단에 2px 여백 추가
        });

        this.skillText = this.add.text(850, 150, '스킬 : ', {
            fontSize: '36px',
            fill: '#ffffff',
            fontFamily: 'HeirofLightBold',
            padding: { top: 2, bottom: 2 }, // 상단과 하단에 2px 여백 추가
        });

        // 대사 출력 관련
        this.messageModule = new MessageModule(this);
        this.messageModule.createUI();
        this.messageModule.hideUI(); // 처음엔 숨김

        // 충돌 처리
        this.physics.add.overlap(this.playerBullets, this.enemies, this.handleBulletHit, null, this);
        this.physics.add.overlap(this.enemyBullets, this.playerHitbox, this.handlePlayerHit, null, this);

        // 월드맵을 벗어난 탄막 제거
        this.physics.world.on('worldbounds', (body) => {
            if (body.gameObject && this.enemyBullets.contains(body.gameObject)) {
                body.gameObject.destroy();
            }
        });

        this.damageSFX = this.sound.add('sfx_damage');

        // 키 입력 처리
        this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        this.bgm = this.sound.add('dark', { loop: true });
        this.bgm.setVolume(0.4).play();
    }

    // 대사 출력을 위한 게임 정지
    pauseForDialogue(dialogues) {
        // 화면에 있는 탄막 제거
        this.playerBullets.clear(true, true);
        this.enemyBullets.clear(true, true);

        this.physics.pause();     // 물리 엔진 정지
        this.time.paused = true;  // 타이머 정지
        this.isDialogueActive = true;

        this.currentDialogueIndex = 0;
        this.currentDialogues = dialogues;

        this.showNextDialogue();
    }

    // 대사 진행
    showNextDialogue() {
        if (this.currentDialogueIndex < this.currentDialogues.length) {
            this.endSkill();
            const dialogue = this.currentDialogues[this.currentDialogueIndex];

            this.messageModule.restoreUI();
            this.messageModule.updateDialogue(dialogue, () => {
                this.currentDialogueIndex++;
                this.showNextDialogue();
            });
        } else {
            this.resumeAfterDialogue();
        }
    }

    // 대사 출력 이후 게임 재개
    resumeAfterDialogue() {
        this.messageModule.hideUI();
        this.physics.resume();
        this.time.paused = false;
        this.isDialogueActive = false;

        this.bgm.stop();
        if (this.HiddenSceneDone)
            this.scene.start('VideoCutScene', { videoSrc: 'Jaeminsuki_buriburi' });
        else
            this.scene.start('VideoCutScene', { videoSrc: 'junsusuki_keyboard' });
    }

    startJoystick(pointer) {
        if (Phaser.Math.Distance.Between(pointer.x, pointer.y, this.joystickBase.x, this.joystickBase.y) < 50) {
            this.joystickActive = true;
        }
    }

    moveJoystick(pointer) {
        if (this.joystickActive) {
            const angle = Phaser.Math.Angle.Between(
                this.joystickBase.x,
                this.joystickBase.y,
                pointer.x,
                pointer.y
            );

            const distance = Phaser.Math.Clamp(
                Phaser.Math.Distance.Between(
                    this.joystickBase.x,
                    this.joystickBase.y,
                    pointer.x,
                    pointer.y
                ),
                0,
                50
            );

            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;

            this.joystickHandle.setPosition(this.joystickBase.x + dx, this.joystickBase.y + dy);

            // 플레이어 이동
            this.player.setVelocity(dx * 11, dy * 11);
        }
    }

    stopJoystick() {
        this.joystickActive = false;
        this.joystickHandle.setPosition(this.joystickBase.x, this.joystickBase.y);
        this.player.setVelocity(0, 0);
    }

    updatePlayerHPBar() {
        for (let i = 0; i < this.maxHP; i++) {
            if (i < this.playerHP) {
                this.heartIcons[i].setTexture('heart');
            } else {
                this.heartIcons[i].setVisible(i < this.playerHP);
            }
        }
    }

    updateBombUI() {
        for (let i = 0; i < this.maxBombs; i++) {
            if (i < this.currentBombs) {
                this.bombIcons[i].setVisible(true);
            } else {
                this.bombIcons[i].setVisible(false);
            }
        }
    }

    shootPlayerBullet() {
        if (this.spaceKeyDown && !this.gameOver) {
            const straightBullet = this.playerBullets.create(this.player.x, this.player.y + 20, 'bullet');
            straightBullet.setVelocityY(-1000);
            straightBullet.setScale(0.2);

            const leftBullet = this.playerBullets.create(this.player.x, this.player.y + 20, 'bullet');
            leftBullet.setVelocity(-200, -1500);
            leftBullet.setScale(0.1);

            const rightBullet = this.playerBullets.create(this.player.x, this.player.y + 20, 'bullet');
            rightBullet.setVelocity(200, -1500);
            rightBullet.setScale(0.1);
        }
    }

    // 스킬 관련
    activateSkill() {
        if (!this.canUseBomb) return;
        if (this.currentBombs <= 0) return;

        // Bomb 1개 차감
        this.currentBombs--;
        this.updateBombUI();

        this.canUseBomb = false;

        this.bombSFX.play();

        this.enemyBullets.clear(true, true);

        this.isSkillActive = true;
        this.isInvincible = true;

        this.skillWave = this.add.rectangle(
            400,
            720,
            800,
            150,
            0x009900
        );

        this.cameras.main.shake(800, 0.01);

        this.physics.add.existing(this.skillWave);

        this.skillWave.body.setVelocityY(-1200);
        this.skillWave.body.setAllowGravity(false);
        this.skillWave.body.setImmovable(true);

        // 적 탄막 제거
        this.physics.add.overlap(this.skillWave, this.enemyBullets, (wave, bullet) => {
            bullet.destroy();
        });

        // 1초 뒤 자동 삭제
        this.time.delayedCall(1000, () => {
            this.endSkill();
        });

        // 연속 사용 방지 딜레이
        this.time.delayedCall(this.bombDelay, () => {
            this.canUseBomb = true;
        });
    }

    endSkill() {
        if (!this.isSkillActive) return;

        this.isInvincible = false;
        this.isSkillActive = false;

        if (this.skillWave) {
            this.skillWave.destroy();
            this.skillWave = null;
        }
    }

    handleBulletHit(bullet, enemy) {
        // 적 체력 감소
        this.enemyHP -= 1;

        if (this.enemyHP <= 0) {
            if (this.playerHP === 10)
                this.playerHP = 120; // 게임 오버 연출 중복 실행 방지
            bullet.destroy();
            enemy.destroy();
            this.cameras.main.flash(2000, 255, 255, 255);
            setTimeout(() => {
                this.isClear = true;
            }, 2000);
        }
    }

    handlePlayerHit(player, bullet) {
        if (this.isInvincible) {
            bullet.destroy();
            return;
        }

        this.damageSFX.play();
        bullet.destroy();

        // 무적 시작
        this.isInvincible = true;

        // 1초 동안 화면이 빨갛게 번쩍임 (플레이어 피격 연출)
        this.cameras.main.flash(1000, 255, 0, 0);

        // 무적 연출
        this.tweens.add({
            targets: this.player,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 10
        });

        // 플레이어 체력 감소
        this.playerHP -= 1;
        this.updatePlayerHPBar();

        // 무적 타이머
        this.time.delayedCall(this.invincibleDuration, () => {
            this.isInvincible = false;
        });

        if (this.playerHP <= 0) {
            // 게임 오버 연출 시작
            this.gameOverSequence();
        }
    }

    gameOverSequence() {
        this.gameOver = true;

        // 모든 게임 요소 제거 및 충돌 처리 중지
        this.physics.pause();  // 물리 엔진 정지
        this.player.setVisible(false);  // 플레이어 숨기기
        this.playerHitbox.setVisible(false); // 플레이어 피탄 판정 숨기기
        this.playerHitboxBorder.setVisible(false);
        this.enemies.clear(true, true); // 적 제거
        this.playerBullets.clear(true, true); // 플레이어 탄막 제거
        this.enemyBullets.clear(true, true); // 적 탄막 제
        this.controlsText.destroy();
        this.lifeText.destroy();
        this.skillText.destroy();

        if (this.joystickBase) {
            this.joystickBase.setVisible(false);
            this.joystickHandle.setVisible(false);
            this.fireButton.setVisible(false);
            this.fireButtonText.setVisible(false);
            this.bombButton.setVisible(false);
            this.bombButtonText.setVisible(false);
        }

        for (let i = 0; i < this.maxHP; i++) {
            this.heartIcons[i].setVisible(false);
        }
        for (let i = 0; i < this.maxBombs; i++) {
            this.bombIcons[i].setVisible(false);
        }

        // 배경 변경: 게임 오버 화면으로 설정
        this.background.setVisible(false);
        this.backgroundUI.setTexture('gameover');
        this.bgm.stop();

        this.sound.add('Jaemin_laugh').setVolume(0.3).play();

        setTimeout(() => {
            window.location.reload();
        }, 2800);
    }

    update() {
        if (this.gameOver) return;
        if (this.isDialogueActive) return;

        if (this.enemyHP <= 500 && !this.dialogueTriggered) {
            this.dialogueTriggered = true;

            this.sovietSFX.play();

            this.pauseForDialogue([
                { name: '블라디미르 준수스키', text: 'сука блять !' },
                { name: '재민(가명)', text: '!!! 아까 도망쳤던 놈!' },
                { name: '블라디미르 준수스키', text: '「그 분」까지 쓰러뜨리다니, 이러면 안 돼. 이러면 내 목적마저도 나가리야.' },
                { name: '재민(가명)', text: '네 목적?' },
                { name: '블라디미르 준수스키', text: '듣자 하니 당신이 살던 세계에선 「소련」이 멸망했다고 하더군요.' },
                { name: '블라디미르 준수스키', text: '하지만! 이곳은 평행 세계. 그쪽 세계의 인물인 당신을 제물로 삼아 그쪽 세계에 영향을 끼칠 수 있죠.' },
                { name: '재민(가명)', text: '너 이 스키, 설마?!' },
                { name: '블라디미르 준수스키', text: '「그 분」과는 달리, 저는 그런 시덥잖은 목적으로 당신을 휘말리게 한 게 아닙니다. 그저...' },
                { name: '블라디미르 준수스키', text: '소비에트 연방의 재건을 위하여!\n\n\n(제작자의 의견과 전혀 관련이 없습니다.)' },
            ]);
        }

        if (this.HiddenSceneDone){
            this.dialogueTriggered = true;

            this.pauseForDialogue([
                { name: '블라디미르 준수스키', text: '이것으로 「그」는 부활했습니다.' },
                { name: '재민(가명)', text: '?!' },
                { name: '나카무라 폰 아인츠베른 재민스키', text: '...이젠 이 세계가 어떻게 되든 상관 없다. 그러므로 「금단의 방법」을 사용할 것이다.' },
                { name: '나카무라 폰 아인츠베른 재민스키', text: '이 세계와 내 모든 것을 걸고 네녀석 만큼은 확실하게 처리해 주겠다!' }
            ]);
        }

        // 플레이어 이동 제한 및 속도 개선
        if (this.cursors.left.isDown) this.player.x = Math.max(this.player.x - 5, 0); // 왼쪽 경계 제한
        else if (this.cursors.right.isDown) this.player.x = Math.min(this.player.x + 5, 1260); // 오른쪽 경계 제한

        if (this.cursors.up.isDown) this.player.y = Math.max(this.player.y - 5, 0); // 상단 경계 제한
        else if (this.cursors.down.isDown) this.player.y = Math.min(this.player.y + 5, 690); // 하단 경계 제한

        // 히트박스 위치 동기화
        this.playerHitbox.setPosition(this.player.x, this.player.y);

        // 적 경계 이탈 방지
        this.enemies.children.iterate((enemy) => {
            if (enemy.x <= 0 || enemy.x >= 1260) enemy.setVelocityX(-enemy.body.velocity.x);
            if (enemy.y <= 0 || enemy.y >= 690) enemy.setVelocityY(-enemy.body.velocity.y);
        });

        // 스킬(Bomb) 처리
        if (Phaser.Input.Keyboard.JustDown(this.shiftKey)) {
            this.activateSkill();
        }
    }
}