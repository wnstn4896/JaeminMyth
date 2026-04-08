import { MessageModule } from './MessageModule.js';

export class Stage3BattleScene extends Phaser.Scene {
    constructor() {
        super('Stage3BattleScene');
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

        this.firstDialogueDone = false;
        this.secondDialogueDone = false;
        this.sovietSpawned = false;
        this.sovietTimer = null;

        this.isClear = false;
    }

    create() {
        // 배경 설정
        this.backgroundUI = this.add.tileSprite(640, 360, 1280, 720, 'background'); // 배경 UI

        // 인게임 배경
        // this.background = this.add.video(400, 200, 'toongsil');
        // this.background = this.add.video(400, 400, 'Jaeminsuki_buriburi');
        this.background = this.add.video(400, 500, 'Kazachok');
        this.background.setScale(1.8);
        // this.background.setLoop(true);
        this.background.play(true);

        // 클리핑 영역을 위한 그래픽스 객체 생성
        const maskShape = this.make.graphics({}, false);
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(0, 0, 808, 720); // 월드 경계와 동일한 크기

        const mask = maskShape.createGeometryMask();
        this.background.setMask(mask);

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

        // 적 체력 바
        this.enemyHPBar = this.add.graphics();
        this.updateEnemyHPBar(); // 체력 바 초기화

        // 탄막 그룹 설정
        this.playerBullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group({
            allowGravity: false
        });

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

        // 적 텔레포트 및 무작위 탄막 발사
        this.time.addEvent({
            delay: 450, // 텔레포트 주기
            callback: this.teleportEnemy,
            callbackScope: this,
            loop: true,
        });

        this.time.addEvent({
            delay: 200,
            callback: () => {

                const patterns = ['I', 'O', 'L', 'T', 'J', 'S', 'Z'];
                const pattern = Phaser.Utils.Array.GetRandom(patterns);

                const colors = ['red_block', 'blue_block'];
                const color = Phaser.Utils.Array.GetRandom(colors);

                const x = Phaser.Math.Between(100, 600);

                this.spawnTetrisBlock(x, 0, pattern, color);

            },
            loop: true
        });

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
            const obj = body.gameObject;
            if (!obj) return;
            if (this.enemyBullets.contains(obj)) {
                // soviet 탄막은 파괴하지 않음
                if (obj.isSoviet) return;
                obj.destroy();
            }
        });

        this.damageSFX = this.sound.add('sfx_damage');

        // 키 입력 처리
        this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        this.bgm = this.sound.add('CheekiBreeki', { loop: true });
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

        // 소비에트 필살기 생성
        if (this.enemyHP <= 300 && !this.sovietSpawned) {
            this.sovietSpawned = true;

            this.spawnSovietBullet();

            this.sovietTimer = this.time.addEvent({
                delay: 2000,
                callback: this.spawnSovietBullet,
                callbackScope: this,
                loop: true
            });
        }

        // 클리어 시 다음 씬 이동
        if (this.isClear) {
            this.bgm.stop();
            sessionStorage.setItem("stageClear", 3);
            this.scene.start('VideoCutScene', { videoSrc: 'Nigerundayo' });
        }
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

    updateEnemyHPBar() {
        this.enemyHPBar.clear();
        this.enemyHPBar.fillStyle(0xff0000, 1); // 빨간색
        this.enemyHPBar.fillRect(20, 20, (this.enemyHP / 500) * 700, 20); // 적 체력 바 위치
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

    teleportEnemy() {
        this.enemies.children.iterate((enemy) => {
            enemy.setVelocityY(50); // 초기 속도 설정
            enemy.setVelocityX(-50);
            // 화면 내 무작위 위치로 텔레포트
            enemy.setPosition(
                Phaser.Math.Between(100, 580), // 무작위 X
                Phaser.Math.Between(100, 250)   // 무작위 Y
            );

            if (enemy.active) {
                for (let angle = 0; angle <= 360; angle += 45) {
                    const bullet = this.enemyBullets.create(enemy.x - 20, enemy.y, 'junsusuki_bullet');
                    const velocity = new Phaser.Math.Vector2(50, 500).rotate(Phaser.Math.DegToRad(angle));
                    bullet.setVelocity(velocity.x, velocity.y);
                    bullet.setScale(0.3);
                    bullet.setCollideWorldBounds(true);
                    bullet.body.onWorldBounds = true;
                }
            }
        });
    }

    rotatePattern(pattern, rotation) {
        let rotated = pattern;

        for (let i = 0; i < rotation; i++) {
            rotated = rotated.map(([x, y]) => [-y, x]);
        }

        return rotated;
    }

    spawnTetrisBlock(x, y, patternName, color = 'red_block') {
        if (this.gameOver)
            return;

        const TETRIS_PATTERNS = {
            I: [
                [0, 0], [1, 0], [2, 0], [3, 0]
            ],
            O: [
                [0, 0], [1, 0],
                [0, 1], [1, 1]
            ],
            T: [
                [0, 0], [1, 0], [2, 0],
                [1, 1]
            ],
            L: [
                [0, 0],
                [0, 1],
                [0, 2],
                [1, 2]
            ],
            J: [
                [1, 2],
                [1, 1],
                [0, 2], [1, 2]
            ],
            S: [
                [1, 0], [2, 0],
                [0, 1], [1, 1]
            ],
            Z: [
                [0, 0], [1, 0],
                [1, 1], [2, 1]
            ]
        };

        let pattern = TETRIS_PATTERNS[patternName];
        // 랜덤 회전
        const rotation = Phaser.Math.Between(0, 3);
        pattern = this.rotatePattern(pattern, rotation);

        const blockSize = 48;

        pattern.forEach(([px, py]) => {
            const block = this.enemyBullets.create(
                x + px * blockSize,
                y + py * blockSize,
                color
            );

            block.setVelocityY(600);
            block.setScale(0.3);
            block.setCollideWorldBounds(true);
            block.body.onWorldBounds = true;
        });
    }

    // 소비에트 국기 탄막
    spawnSovietBullet() {
        const enemy = this.enemies.getChildren()[0];
        if (!enemy) return;

        this.sovietSFX.play();
        this.cameras.main.shake(300, 0.03);

        const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'soviet');

        bullet.setScale(0.6);
        const vx = Phaser.Math.Between(-200, 200);
        bullet.setVelocity(vx, 600);

        bullet.setCollideWorldBounds(true);

        bullet.setBounce(1, 1); // 완전 반사

        bullet.body.onWorldBounds = true;

        bullet.isSoviet = true;

        // 8초 뒤 자동 삭제
        this.time.delayedCall(7000, () => {
            if (bullet && bullet.active) bullet.destroy();
        });
    }

    shootPlayerBullet() {
        if (this.spaceKeyDown && !this.gameOver) {
            const straightBullet = this.playerBullets.create(this.player.x, this.player.y + 20, 'bullet');
            straightBullet.setVelocityY(-1000);
            straightBullet.setScale(0.2);

            const leftBullet = this.playerBullets.create(this.player.x, this.player.y + 20, 'bullet');
            leftBullet.setVelocity(-200, -1500);
            leftBullet.setScale(0.1);

            // 레벨업 시 탄막 추가(예정)
            /*
            const rightBullet = this.playerBullets.create(this.player.x, this.player.y + 20, 'bullet');
            rightBullet.setVelocity(200, -1500);
            rightBullet.setScale(0.1);
            */
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
        this.updateEnemyHPBar();

        if (this.enemyHP <= 0) {
            bullet.destroy();
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

        if (this.playerHP <= 0 && this.enemyHP > 0) {
            // 게임 오버 연출 시작
            this.gameOverSequence();
        }
    }

    gameOverSequence() {
        this.gameOver = true;

        // 타이머 정지
        this.time.removeAllEvents();

        // 모든 게임 요소 제거 및 충돌 처리 중지
        this.physics.pause();  // 물리 엔진 정지
        this.player.setVisible(false);  // 플레이어 숨기기
        this.playerHitbox.setVisible(false); // 플레이어 피탄 판정 숨기기
        this.playerHitboxBorder.setVisible(false);
        this.enemies.clear(true, true); // 적 제거
        this.enemyHPBar.setVisible(false);
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
        this.backgroundUI.setTexture('background_black');
        this.bgm.stop();

        setTimeout(() => {
            this.scene.start('VideoCutScene', { videoSrc: 'gameover' });
        }, 500);
    }

    update() {
        if (this.isDialogueActive) return;

        if (this.enemyHP <= 500 && !this.firstDialogueDone) {
            this.firstDialogueDone = true;

            this.pauseForDialogue([
                { name: '블라디미르 준수스키', text: '거기 당신, 어디로 가시는 겁니까?' },
                { name: '블라디미르 준수스키', text: '그냥 지나가시려는 겁니까?' },
                { name: '재민(가명)', text: '넌 또 뭐야?!' },
                { name: '블라디미르 준수스키', text: '당신을 이 세계 끌어들인 장본인입니다. 모든 것은 「그 분」의 의지를 따라서...' },
                { name: '재민(가명)', text: '도대체 왜 그런 거냐? 여기는 도대체 어디고?' },
                { name: '블라디미르 준수스키', text: '저를 쓰러뜨리고 다음 장소로 넘어가면 차차 알게 될 겁니다.' },
                { name: '블라디미르 준수스키', text: '그나저나, 당신은 테트리스를 알고 있습니까?' },
                { name: '재민(가명)', text: '테트리스? 학교 컴퓨터실에서 매일같이 하던 그 게임 말이냐?' },
                { name: '블라디미르 준수스키', text: '테트리스는 「소련」의 프로그래머인 알렉세이 파지트노프가 만든 퍼즐 게임입니다.' },
                { name: '블라디미르 준수스키', text: '당신은 게임을 하는 것이 아닙니다. 이곳에선 게임이 당신을 합니다.' },
                { name: '재민(가명)', text: '뭔 개소리야? 일단 딱 대라!' },
            ]);
        }

        if (this.enemyHP <= 300 && !this.secondDialogueDone) {
            this.secondDialogueDone = true;

            this.pauseForDialogue([
                { name: '블라디미르 준수스키', text: '역시 보통이 아니군요.' },
                { name: '블라디미르 준수스키', text: '탄막의 상태를 보니 방금 전의 녀석을 쓰러뜨리고 레벨업을 했나 봅니다.' },
                { name: '블라디미르 준수스키', text: '하지만, 우리 소비에트 연방의 저력은 고작 이 정도가 아닙니다. 잘 보시죠.' },
            ]);
        }

        if (this.isClear) {
            this.dialogueTriggered = true;

            this.pauseForDialogue([
                { name: '블라디미르 준수스키', text: '...이럴수가' },
                { name: '재민(가명)', text: '뭐야? 이 놈 어떻게 살아있어?' },
                { name: '블라디미르 준수스키', text: '저도 보통 인물이 아닙니다. 아무튼, 이렇게 된 이상...!' },
            ]);
        }

        // 플레이어 이동 제한 및 속도 개선
        this.player.setVelocity(0);

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-450);
        }
        else if (this.cursors.right.isDown) {
            this.player.setVelocityX(450);
        }

        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-450);
        }
        else if (this.cursors.down.isDown) {
            this.player.setVelocityY(450);
        }

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