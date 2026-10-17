import { MessageModule } from './MessageModule.js';

export class Stage5BattleScene extends Phaser.Scene {
    constructor() {
        super('Stage5BattleScene');
        this.enemyHP = 2100;  // 적 체력
        this.shiftKey;

        this.maxHP = 7; // 최대 HP
        this.playerHP = 7; // 현재 HP
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
        this.thirdDialogueDone = false;

        this.firstTurn = true;
        this.stoneTurn = false;
        this.jjokbarisukiTurn = false;
        this.junsusukiTurn = false;
        this.jaeminsukiTurn = false;

        this.allDefeated = false;
        this.isClear = false;

        this.patternRotation = 0;       // 현재 탄막 회전 각도
        this.patternRotationSpeed = 16;

        this.stonePatternEvent = null; // 2페이즈 패턴 타이머
        this.stonePatternInterval = 4000; // 패턴 반복 간격
        this.stonePatternDelay = 3000; // 소환 후 폭발까지 대기 시간

        this.stoneMinions = [];
        this.stonePatternStarted = false; // 패턴 중복 시작 방지

        this.blasterList = [];
        this.teleportEnemySprite = null;
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

        this.voiceSFX3 = this.sound.add('Jaemin_voice3');

        this.appearSFX = this.sound.add('sfx_soulAppear', { volume: 0.7 });

        this.droneSFX = this.sound.add('sfx_AIdroneBot', { volume: 0.4 });

        this.kingCrimsonSFX = this.sound.add('sfx_KingCrimson');
        this.timeSkipSFX = this.sound.add('sfx_timeSkip');

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
            key: 'Omega_jaeminsuki_default',
            repeat: 0, // 적 1개만 생성
            setXY: { x: 400, y: 182 },
        });

        this.enemies.children.iterate((enemy) => {
            enemy.setScale(1);
            // enemy.setCollideWorldBounds(true); // 월드 경계 밖으로 못 나가게 설정
            enemy.setImmovable(true);
            enemy.body.setAllowGravity(false);
        });

        this.monitor = this.add.video(400, 55, 'Jaemin_Appear');
        this.monitor.setScale(0.087);
        this.monitor.play(true);

        // 클리핑 영역을 위한 그래픽스 객체 생성
        this.maskShape = this.make.graphics({}, false);
        this.maskShape.fillStyle(0xffffff);
        this.maskShape.fillRect(100, 0, 400, 720);

        this.monitorMask = this.maskShape.createGeometryMask();
        this.monitor.setMask(this.monitorMask);

        // 적 텔레포트 및 무작위 탄막 발사
        this.bulletEnemyEvent = this.time.addEvent({
            delay: 280,
            callback: this.bulletEnemy,
            callbackScope: this,
            loop: true,
        });

        this.time.addEvent({
            delay: 600, // 텔레포트 주기
            callback: this.teleportEnemy,
            callbackScope: this,
            loop: true,
        });

        // 블래스터 공격 타이머
        this.blasterEvent = this.time.addEvent({
            delay: 3000,
            callback: this.spawnBlaster,
            callbackScope: this,
            loop: true,
        });

        this.time.addEvent({
            delay: 1000,
            callback: () => {

                const patterns = ['I', 'O', 'L', 'T', 'J', 'S', 'Z'];
                const pattern = Phaser.Utils.Array.GetRandom(patterns);

                const colors = ['red_block', 'blue_block'];
                const color = Phaser.Utils.Array.GetRandom(colors);

                const x = Phaser.Math.Between(100, 600);

                this.spawnTetrisBlock(x, 200, pattern, color);

            },
            loop: true
        });

        this.time.addEvent({
            delay: 5000, // 시간삭제 주기
            callback: this.kingCrimson,
            callbackScope: this,
            loop: true,
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
        this.physics.add.collider(this.player, this.enemies);

        // 월드맵을 벗어난 탄막 제거
        this.physics.world.on('worldbounds', (body) => {
            if (body.gameObject && this.enemyBullets.contains(body.gameObject)) {
                body.gameObject.destroy();
            }
        });

        this.damageSFX = this.sound.add('sfx_damage');

        // 키 입력 처리
        this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        // BGM 목록
        this.bgmList = {
            phase1: 'JoJo_Awaken_part2',
            phase2: 'megalovania',
            phase3: 'tajiri_theme',
            phase4: 'tetrisBGM',
            phase5: 'finale',
            phase6: 'JoJo_Fight_to_Antagonize'
        };

        // 현재 재생 중인 BGM
        this.currentBGM = null;

        // 최초 페이즈 BGM 재생
        this.changeBGM('phase1', 0.4);
    }

    changeBGM(phase, volume = 0.4) {
        const bgmKey = this.bgmList[phase];

        if (!bgmKey){ return; }

        // 같은 BGM이 이미 재생 중이면 중복 실행 방지
        if (this.currentBGM && this.currentBGM.key === bgmKey && this.currentBGM.isPlaying) { return; }

        // 이전 BGM 정지
        if (this.currentBGM)
            this.currentBGM.stop();

        // 새로운 BGM 재생
        this.currentBGM = this.sound.add(bgmKey, {
            loop: true,
            volume: volume
        });

        this.currentBGM.play();
    }

    // 대사 출력을 위한 게임 정지
    pauseForDialogue(dialogues) {
        // 화면에 있는 탄막 제거
        this.playerBullets.clear(true, true);
        this.enemyBullets.clear(true, true);
        // 화면에 있는 블래스터 제거
        this.clearBlasters();
        // 드론 제거
        this.clearStoneMinions();

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

        // 2페이즈 대사가 끝나면 특수 패턴 시작
        if (this.stoneTurn && !this.stonePatternStarted) {
            this.startStonePhasePattern();
        }

        // 클리어 시 다음 씬 이동
        if (this.isClear) {
            if (this.currentBGM) {
                this.currentBGM.stop();
                this.currentBGM = null;
            }

            sessionStorage.setItem("stageClear", 5);
            this.scene.start('LoadingScene', { goToStage: 'CreditsScene' });
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

    updateBombUI() {
        for (let i = 0; i < this.maxBombs; i++) {
            if (i < this.currentBombs) {
                this.bombIcons[i].setVisible(true);
            } else {
                this.bombIcons[i].setVisible(false);
            }
        }
    }

    hideMonitor() {
        if (this.monitor) {
            this.monitor.stop();
            this.monitor.setVisible(false);
            this.monitor.clearMask();
        }

        if (this.monitorMask) {
            this.monitorMask.destroy();
            this.monitorMask = null;
        }

        if (this.maskShape) {
            this.maskShape.destroy();
            this.maskShape = null;
        }
    }

    bulletEnemy() {
        this.enemies.children.iterate((enemy) => {
            if (!enemy.active) return;

            // 호출될 때마다 패턴 전체를 시계 방향으로 회전
            this.patternRotation += this.patternRotationSpeed;

            // 필요하면 각도 범위 정리
            this.patternRotation = Phaser.Math.Angle.WrapDegrees(this.patternRotation);

            // 아래로 향하는 기본 방향 벡터
            const baseSpeed = 500;

            // 원형 탄막
            for (let angle = 0; angle < 360; angle += 45) {
                if (this.firstTurn || this.jaeminsukiTurn){
                    const bulletTypes = ['red_bullet', 'blue_bullet'];
                    const randomBullet = Phaser.Utils.Array.GetRandom(bulletTypes);

                    const bullet = this.enemyBullets.create(enemy.x, enemy.y + 20, randomBullet);

                    const finalAngle = angle + this.patternRotation;
                    const rad = Phaser.Math.DegToRad(finalAngle);

                    bullet.setVelocity(
                        Math.sin(rad) * baseSpeed,
                        Math.cos(rad) * baseSpeed
                    );

                    bullet.setScale(0.15);
                    bullet.setCollideWorldBounds(true);
                    bullet.body.onWorldBounds = true;
                }
                else if (this.stoneTurn) {
                    const bulletCount = 2;
                    const spreadAngle = 90;

                    // 아래쪽을 기준으로 좌우로 퍼지게 설정
                    const centerAngle = 0;
                    const startAngle = centerAngle - spreadAngle / 2;
                    const angleStep = spreadAngle / (bulletCount - 1);

                    for (let i = 0; i < bulletCount; i++) {
                        const angle = startAngle + angleStep * i;
                        const rad = Phaser.Math.DegToRad(angle);

                        const bullet = this.enemyBullets.create(
                            enemy.x,
                            enemy.y + 20,
                            'stone_bullet'
                        );

                        bullet.setVelocity(
                            Math.sin(rad) * baseSpeed,
                            Math.cos(rad) * baseSpeed
                        );

                        bullet.setScale(0.15);
                        bullet.setCollideWorldBounds(true);
                        bullet.body.onWorldBounds = true;
                    }
                }
                else if (this.jjokbarisukiTurn){
                    const bulletCount = 4;
                    const spreadAngle = 90;

                    // 아래쪽을 기준으로 좌우로 퍼지게 설정
                    const centerAngle = 0;
                    const startAngle = centerAngle - spreadAngle / 2;
                    const angleStep = spreadAngle / (bulletCount - 1);

                    for (let i = 0; i < bulletCount; i++) {
                        const angle = startAngle + angleStep * i;
                        const rad = Phaser.Math.DegToRad(angle);

                        const bullet = this.enemyBullets.create(
                            enemy.x,
                            enemy.y + 20,
                            'jjokbarisuki_bullet'
                        );

                        bullet.setVelocity(
                            Math.sin(rad) * baseSpeed,
                            Math.cos(rad) * baseSpeed
                        );

                        bullet.setScale(0.25);
                        bullet.setCollideWorldBounds(true);
                        bullet.body.onWorldBounds = true;
                    }
                }
            }
        });
    }

    createTeleportEnemy(texture = 'junsusuki') {
        if (this.teleportEnemySprite?.active) {
            this.teleportEnemySprite.setTexture(texture);
        } else {
            this.teleportEnemySprite = this.add.sprite(
                400,
                400,
                texture
            );
        }

        // 페이즈별 스프라이트 크기 설정
        if (this.junsusukiTurn && !this.jaeminsukiTurn) {
            this.teleportEnemySprite.setScale(0.27);
        } else if (this.jaeminsukiTurn && !this.junsusukiTurn) {
            this.teleportEnemySprite.setScale(0.001);
        }

        this.teleportEnemySprite.setDepth(10);
        this.teleportEnemySprite.setVisible(false);
    }

    teleportEnemy() {
        if (!this.junsusukiTurn && !this.jaeminsukiTurn) return;

        const spriteKey = this.jaeminsukiTurn
            ? 'red_bullet'
            : 'junsusuki';

        // 스프라이트가 없거나 제거된 경우 생성
        if (!this.teleportEnemySprite?.active) {
            this.createTeleportEnemy(spriteKey);
        }

        const enemy = this.teleportEnemySprite;

        if (!enemy || !enemy.active) return;

        // 페이즈에 맞는 텍스처 적용
        enemy.setTexture(spriteKey);
        enemy.setVisible(true);

        // 무작위 위치로 텔레포트
        enemy.setPosition(
            Phaser.Math.Between(100, 580),
            Phaser.Math.Between(300, 350)
        );

        if (this.junsusukiTurn){
            for (let angle = 0; angle < 360; angle += 45) {
                const bullet = this.enemyBullets.create(
                    enemy.x - 20,
                    enemy.y,
                    'junsusuki_bullet'
                );

                if (!bullet) continue;

                const velocity = new Phaser.Math.Vector2(50, 500)
                    .rotate(Phaser.Math.DegToRad(angle));

                bullet.setVelocity(velocity.x, velocity.y);
                bullet.setScale(0.3);
                bullet.setCollideWorldBounds(true);
                bullet.body.onWorldBounds = true;
            }
        }
        else if (this.jaeminsukiTurn){
            for (let angle = 0; angle < 360; angle += 45) {
                const bullet = this.enemyBullets.create(
                    enemy.x - 20,
                    enemy.y,
                    'jaeminsuki_bullet'
                );

                if (!bullet) continue;

                const velocity = new Phaser.Math.Vector2(50, 500)
                    .rotate(Phaser.Math.DegToRad(angle));

                bullet.setVelocity(velocity.x, velocity.y);
                bullet.setScale(0.15);
                bullet.setCollideWorldBounds(true);
                bullet.body.onWorldBounds = true;
            }
        }
    }

    removeTeleportEnemy() {
        if (this.teleportEnemySprite) {
            this.teleportEnemySprite.destroy();
            this.teleportEnemySprite = null;
        }
    }

    spawnBlaster() {
        if (this.physics.world.isPaused) return;
        if (this.gameOver || this.isClear) return;

        // 1페이즈 또는 3페이즈에서만 블래스터 사용
        if (!this.firstTurn && !this.jjokbarisukiTurn) return;

        const x = Phaser.Math.Between(50, 740);
        const y = Phaser.Math.Between(300, 500);

        // 현재 페이즈에 따라 스프라이트 선택
        const blasterTexture = this.jjokbarisukiTurn
            ? 'Jaemin_breath_green1'
            : 'Jaemin_breath1';

        const blaster = this.add.sprite(x, y, blasterTexture);
        blaster.setScale(0.6);

        this.blasterList.push(blaster);

        blaster.fireTexture = this.jjokbarisukiTurn
        ? 'Jaemin_breath_green2'
        : 'Jaemin_breath2';

        this.sound.play('sfx_breathCharge');

        // 플레이어 방향 계산
        const rawAngle = Phaser.Math.Angle.Between(
            x, y,
            this.player.x, this.player.y
        );

        // 4방향 대각선으로 스냅
        const directions = [
            Phaser.Math.DegToRad(45),
            Phaser.Math.DegToRad(135),
            Phaser.Math.DegToRad(-45),
            Phaser.Math.DegToRad(-135),
        ];

        let angle = directions[0];
        let minDiff = Math.abs(
            Phaser.Math.Angle.Wrap(rawAngle - angle)
        );

        for (const dir of directions) {
            const diff = Math.abs(
                Phaser.Math.Angle.Wrap(rawAngle - dir)
            );

            if (diff < minDiff) {
                minDiff = diff;
                angle = dir;
            }
        }

        // 좌우 반전 처리
        blaster.setFlipY(Math.cos(angle) < 0);
        blaster.rotation = angle;

        // 1초 후 발사
        this.time.delayedCall(1000, () => {
            this.fireBlaster(blaster, angle);
        });
    }

    fireBlaster(blaster, angle) {
        if (!blaster || !blaster.active) return;

        // 1페이즈와 3페이즈에서만 발사
        if (
            this.gameOver ||
            this.isClear ||
            (!this.firstTurn && !this.jjokbarisukiTurn)
        ) {
            blaster.destroy();
            return;
        }

        // 생성 시 저장한 페이즈별 발사 스프라이트 사용
        blaster.setTexture(blaster.fireTexture);

        this.sound.play('sfx_breathFire');

        const bulletSpeed = 1000;
        const fireRate = 50;
        const duration = 1000;

        const shootEvent = this.time.addEvent({
            delay: fireRate,
            repeat: duration / fireRate,
            callback: () => {
                if (!blaster.active || this.gameOver) return;

                const spread = Phaser.Math.DegToRad(
                    Phaser.Math.Between(-10, 10)
                );

                const finalAngle = angle + spread;

                const bullet = this.enemyBullets.create(
                    blaster.x,
                    blaster.y + 40,
                    'green_bullet'
                );

                if (!bullet) return;

                bullet.setScale(0.2);
                bullet.setVelocity(
                    Math.cos(finalAngle) * bulletSpeed,
                    Math.sin(finalAngle) * bulletSpeed
                );

                bullet.setCollideWorldBounds(true);
                bullet.body.onWorldBounds = true;
            }
        });

        this.cameras.main.shake(800, 0.01);

        this.time.delayedCall(duration, () => {
            shootEvent.remove();

            if (blaster.active) {
                blaster.destroy();
            }
        });
    }

    clearBlasters() {
        // 생성된 블래스터 전부 제거
        this.blasterList.forEach((blaster) => {
            if (blaster && blaster.active) {
                blaster.destroy();
            }
        });

        this.blasterList = [];
    }

    clearStoneMinions() {
        // 드론 제거
        this.stoneMinions.forEach((minion) => {
            if (minion && minion.active) {
                this.tweens.killTweensOf(minion);
                minion.destroy();
            }
        });

        this.stoneMinions = [];
    }

    startStonePhasePattern() {
        if (this.stonePatternStarted || this.gameOver || this.isClear) {
            return;
        }

        this.stonePatternStarted = true;

        // 첫 패턴을 바로 시작
        this.spawnStoneMinions();

        // 이후 일정 간격으로 반복
        this.stonePatternEvent = this.time.addEvent({
            delay: 5000,
            callback: this.spawnStoneMinions,
            callbackScope: this,
            loop: true,
        });
    }

    spawnStoneMinions() {
        if (this.gameOver || this.isClear || !this.stoneTurn) {
            return;
        }

        // 기존 기체가 남아 있다면 중복 소환 방지
        if (this.stoneMinions.some(minion => minion.active)) {
            return;
        }

        const positions = [
            { x: 80, y: 550 },
            { x: 710, y: 550 },
        ];

        positions.forEach((pos) => {
            this.droneSFX.play();
            this.cameras.main.flash(1000, 255, 255, 255);

            // AI 드론봇 소환
            const minion = this.add.sprite(
                pos.x,
                pos.y,
                'drone'
            );

            minion.setScale(0.3);
            minion.setDepth(5);

            this.stoneMinions.push(minion);

            // 3초 후 폭발
            this.time.delayedCall(this.stonePatternDelay, () => {
                if (!minion.active || this.gameOver || this.isClear) {
                    return;
                }

                this.explodeStoneMinion(minion);
            });
        });
    }

    explodeStoneMinion(minion) {
        if (!minion || !minion.active) return;

        const x = minion.x;
        const y = minion.y;

        // 폭발 시 기체 제거
        minion.destroy();

        // 폭발 효과
        const explosion = this.add.circle(
            x,
            y,
            10,
            0xffaa33,
            0.9
        );

        explosion.setDepth(6);

        this.tweens.add({
            targets: explosion,
            scale: 5,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                explosion.destroy();
            },
        });

        // 화면 흔들림
        this.cameras.main.shake(150, 0.003);

        // 원형 탄막 발사
        const bulletCount = 24;
        const bulletSpeed = 250;

        for (let i = 0; i < bulletCount; i++) {
            const angle = (360 / bulletCount) * i;
            const rad = Phaser.Math.DegToRad(angle);

            const bullet = this.enemyBullets.create(
                x,
                y,
                'stone_bullet'
            );

            if (!bullet) continue;

            bullet.setScale(0.15);

            bullet.setVelocity(
                Math.cos(rad) * bulletSpeed,
                Math.sin(rad) * bulletSpeed
            );

            bullet.setCollideWorldBounds(true);
            bullet.body.onWorldBounds = true;
        }
    }

    rotatePattern(pattern, rotation) {
        let rotated = pattern;

        for (let i = 0; i < rotation; i++) {
            rotated = rotated.map(([x, y]) => [-y, x]);
        }

        return rotated;
    }

    spawnTetrisBlock(x, y, patternName, color = 'red_block') {
        if (this.gameOver || !this.junsusukiTurn)
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

            block.setVelocityY(400);
            block.setScale(0.3);
            block.setCollideWorldBounds(true);
            block.body.onWorldBounds = true;
        });
    }

    kingCrimson() {
        if (!this.jaeminsukiTurn || this.gameOver)
            return;

        const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000)
            .setOrigin(0)
            .setDepth(999)
            .setAlpha(0);

        this.tweens.add({
            targets: overlay,
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });

        if (this.isDialogueActive || this.enemyHP <= 0) {
            overlay.destroy();
            return;
        }

        this.timeSkip = true;
        this.kingCrimsonSFX.play();

        this.physics.pause();

        this.time.delayedCall(1000, () => {
            this.timeSkip = false;

            this.tweens.add({
                targets: overlay,
                alpha: 0,
                duration: 500,
                onComplete: () => overlay.destroy()
            });

            this.teleportEnemy();
            this.cameras.main.shake(300, 0.05);
            this.timeSkipSFX.play();
            this.physics.resume();
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
        bullet.destroy();

        if (this.enemyHP <= 0) {
            if (this.playerHP === 10)
                this.playerHP = 120; // 게임 오버 연출 중복 실행 방지
            bullet.destroy();
            enemy.destroy();
            this.monitor.setVisible(false);
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
        if (!this.gameOver) {
            this.playerHP -= 1;
            this.updatePlayerHPBar();
        }

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

        // 모든 게임 요소 제거 및 충돌 처리 중지
        this.physics.pause();  // 물리 엔진 정지
        this.player.setVisible(false);  // 플레이어 숨기기
        this.playerHitbox.setVisible(false); // 플레이어 피탄 판정 숨기기
        this.playerHitboxBorder.setVisible(false);
        this.enemies.clear(true, true); // 적 제거
        this.playerBullets.clear(true, true); // 플레이어 탄막 제거
        this.enemyBullets.clear(true, true); // 적 탄막 제거
        this.controlsText.destroy();
        this.lifeText.destroy();
        this.skillText.destroy();

        // 화면에 있는 블래스터 제거
        this.clearBlasters();
        
        // 블래스터 타이머 제거
        if (this.blasterEvent) {
            this.blasterEvent.remove(false);
            this.blasterEvent = null;
        }

        // AI 드론봇 타이머 제거
        if (this.stonePatternEvent) {
            this.stonePatternEvent.remove(false);
            this.stonePatternEvent = null;
        }

        this.stoneMinions.forEach((minion) => {
            if (minion && minion.active) {
                minion.destroy();
            }
        });

        this.stoneMinions = [];

        this.removeTeleportEnemy();

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

        this.monitor.setVisible(false);

        // 배경 변경: 게임 오버 화면으로 설정
        this.backgroundUI.setTexture('background_black');

        if (this.currentBGM) {
            this.currentBGM.stop();
            this.currentBGM = null;
        }

        setTimeout(() => {
            this.scene.start('VideoCutScene', { videoSrc: 'gameover' });
        }, 500);
    }

    update() {
        if (this.isDialogueActive) return;

        if (this.enemyHP <= 6000 && !this.firstDialogueDone) {
            this.firstDialogueDone = true;

            this.voiceSFX3.play();

            this.pauseForDialogue([
                { name: '그랜드 얼티밋 마제스티 재민스키', text: '아무리 네녀석이라도, 나의 힘은 뛰어넘을 수 없을 것이다!' }
            ]);
        }

        if (this.enemyHP <= 5500 && !this.secondDialogueDone) {
            this.secondDialogueDone = true;

            this.pauseForDialogue([
                { name: '재민(가명)', text: '젠장, 공격이 통하는 건지 안 통하는 건지 모르겠네.' },
                { name: '재민(가명)', text: '일단 무작정 공격을 퍼부어 보자.' }
            ]);
        }

        if (this.enemyHP <= 5050 && !this.thirdDialogueDone) {
            this.thirdDialogueDone = true;

            this.pauseForDialogue([
                { name: '그랜드 얼티밋 마제스티 재민스키', text: '지금까지 네놈한테 당한 영혼들을 다 끌어모았다. 잘 봐라!' }
            ]);
        }

        if (this.enemyHP <= 5000 && !this.stoneTurn && !this.jjokbarisukiTurn && !this.junsusukiTurn && !this.jaeminsukiTurn && !this.allDefeated) {
            this.firstTurn = false;
            this.stoneTurn = true;

            this.hideMonitor();
            this.cameras.main.flash(2000, 0, 0, 0);
            this.appearSFX.play();
            this.changeBGM('phase2', 0.4);

            // 적 텍스처 변경 (스테이지 1 강화)
            this.enemies.children.iterate((enemy) => {
                enemy.setTexture('Omega_jaeminsuki_stone');
            });

            this.pauseForDialogue([
                { name: '돌멩이', text: '길바닥의 돌맹이를 밟고 지나간 것을 다시 한 번 후회하게 만들어주마!' }
            ]);
        }

        if (this.enemyHP <= 4000 && !this.jjokbarisukiTurn && this.stoneTurn && !this.junsusukiTurn && !this.jaeminsukiTurn && !this.allDefeated) {
            this.stoneTurn = false;
            this.jjokbarisukiTurn = true;

            this.cameras.main.flash(2000, 0, 0, 0);
            this.appearSFX.play();
            this.changeBGM('phase3', 0.4);

            // 적 텍스처 변경 (스테이지 2 강화)
            this.enemies.children.iterate((enemy) => {
                enemy.setTexture('Omega_jaeminsuki_jjokbarisuki');
            });

            this.pauseForDialogue([
                { name: '쪽바리스키', text: '덴노헤카 반자이다----!!!!!' },
                { name: '쪽바리스키', text: '그린 미스트를 맛 보여주마' }
            ]);
        }

        if (this.enemyHP <= 3000 && !this.junsusukiTurn && this.jjokbarisukiTurn && !this.stoneTurn && !this.jaeminsukiTurn && !this.allDefeated) {
            this.jjokbarisukiTurn = false;
            this.junsusukiTurn = true;

            this.createTeleportEnemy();

            this.cameras.main.flash(2000, 0, 0, 0);
            this.appearSFX.play();
            this.changeBGM('phase4', 0.25);

            // 적 텍스처 변경 (스테이지 3 강화)
            this.enemies.children.iterate((enemy) => {
                enemy.setTexture('Omega_jaeminsuki_junsusuki');
            });

            this.pauseForDialogue([
                { name: '블라디미르 준수스키', text: '모든것은  "그분의" 의지에 따라서...' }
            ]);
        }

        if (this.enemyHP <= 2000 && !this.jaeminsukiTurn && this.junsusukiTurn && !this.jjokbarisukiTurn && !this.stoneTurn && !this.allDefeated) {
            this.junsusukiTurn = false;
            this.jaeminsukiTurn = true;

            this.removeTeleportEnemy();

            this.cameras.main.flash(2000, 0, 0, 0);
            this.appearSFX.play();
            this.changeBGM('phase5', 0.4);

            this.bulletEnemyEvent.delay = 900;

            // 적 텍스처 변경 (스테이지 4 강화)
            this.enemies.children.iterate((enemy) => {
                enemy.setTexture('Omega_jaeminsuki');
            });

            this.pauseForDialogue([
                { name: '그랜드 얼티밋 마제스티 재민스키', text: '이제 다른건 다 필요없다!!!' },
                { name: '그랜드 얼티밋 마제스티 재민스키', text: '내가 지옥으로 떨어지는 한이 있더라도 다 죽여버리겠다!' },
            ]);
        }

        if (this.enemyHP <= 500 && !this.allDefeated && this.jaeminsukiTurn && !this.stoneTurn && !this.jjokbarisukiTurn && !this.junsusukiTurn){
            this.jaeminsukiTurn = false;
            this.allDefeated = true;

            this.cameras.main.flash(2000, 0, 0, 0);
            this.changeBGM('phase6', 0.4);

            this.enemies.children.iterate((enemy) => {
                enemy.setTexture('Omega_jaeminsuki_default');

                enemy.setBounce(1);
                enemy.setCollideWorldBounds(true);
            });

            this.pauseForDialogue([
                { name: '그랜드 얼티밋 마제스티 재민스키', text: '이럴 수가...!' },
                { name: '재민(가명)', text: '드디어 끝인가. 이제 반격이다!' }
            ]);
        }

        if (this.enemyHP <= 0 && this.allDefeated){
            this.pauseForDialogue([
                { name: '재민(가명)', text: '...끝이다.' }
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