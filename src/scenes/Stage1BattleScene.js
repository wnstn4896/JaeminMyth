export class Stage1BattleScene extends Phaser.Scene {
    constructor() {
        super('Stage1BattleScene');
        this.playerHP = 150; // 플레이어 체력
        this.enemyHP = 800;  // 적 체력
    }

    create() {
        // 배경 설정
        this.backgroundUI = this.add.tileSprite(640, 360, 1280, 720, 'background'); // 배경 UI

        // 인게임 배경
        this.background = this.add.video(400, 200, 'toongsil');
        this.background.setScale(3.0);
        this.background.setLoop(true);
        this.background.play(true);

        // 👉 클리핑 영역을 위한 그래픽스 객체 생성
        const maskShape = this.make.graphics({}, false);
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(0, 0, 808, 720); // 월드 경계와 동일한 크기
        
        const mask = maskShape.createGeometryMask();
        this.background.setMask(mask);
        
        this.physics.world.setBounds(0, 0, 790, 720); // 월드 경계 설정

         // 플레이어 생성
        this.player = this.physics.add.sprite(200, 300, 'jaemin');
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

        // 입력 키 설정
        this.cursors = this.input.keyboard.createCursorKeys();

        // 환경 감지: PC인지 모바일인지 확인
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            // **가상 조이스틱 생성**
            this.joystickBase = this.add.circle(100, 600, 70, 0x808080, 0.5);
            this.joystickHandle = this.add.circle(100, 600, 30, 0xffffff, 0.8);
            this.input.on('pointerdown', this.startJoystick, this);
            this.input.on('pointermove', this.moveJoystick, this);
            this.input.on('pointerup', this.stopJoystick, this);

            // **발사 버튼 생성**
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
        }

        // 플레이어 체력 바
        this.playerHPBar = this.add.graphics();
        this.updatePlayerHPBar(); // 체력 바 초기화

        // 적 체력 바
        this.enemyHPBar = this.add.graphics();
        this.updateEnemyHPBar(); // 체력 바 초기화

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
            delay: 100,
            callback: this.shootPlayerBullet,
            callbackScope: this,
            loop: true,
        });

        // 적 생성
        this.enemies = this.physics.add.group({
            key: 'stone',
            repeat: 0, // 적 1개만 생성
            setXY: { x: 300, y: 100 },
        });

        this.enemies.children.iterate((enemy) => {
            enemy.setScale(0.27);
            enemy.setCollideWorldBounds(true); // 월드 경계 밖으로 못 나가게 설정
            enemy.setBounce(1); // 충돌 시 반전
            enemy.setVelocityY(50); // 초기 속도 설정
            enemy.setVelocityX(-50);
        });

        // 적 텔레포트 및 무작위 탄막 발사
        this.time.addEvent({
            delay: 750, // 텔레포트 주기
            callback: this.teleportEnemy,
            callbackScope: this,
            loop: true,
        });

        // 충돌 처리
        this.physics.add.overlap(this.playerBullets, this.enemies, this.handleBulletHit, null, this);
        this.physics.add.overlap(this.enemyBullets, this.playerHitbox, this.handlePlayerHit, null, this);

        // 월드맵을 벗어난 탄막 제거
        this.physics.world.on('worldbounds', (body) => {
            if (body.gameObject && this.enemyBullets.contains(body.gameObject)) {
                body.gameObject.destroy();
            }
        });
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
        this.playerHPBar.clear();
        this.playerHPBar.fillStyle(0x00ff00, 1); // 초록색
        this.playerHPBar.fillRect(20, 660, (this.playerHP / 100) * 100, 20); // 플레이어 체력 바 위치
        // 조작키 설명 텍스트
        this.controlsText = this.add.text(200, 660, '↑↓←→: 이동 | 스페이스바: 탄막 발사', {
            fontSize: '16px',
            fill: '#ffffff',
            padding: { top: 2, bottom: 2 }, // 상단과 하단에 2px 여백 추가
        });
    }
    
    updateEnemyHPBar() {
        this.enemyHPBar.clear();
        this.enemyHPBar.fillStyle(0xff0000, 1); // 빨간색
        this.enemyHPBar.fillRect(20, 20, (this.enemyHP / 800) * 700, 20); // 적 체력 바 위치
    }
    

    teleportEnemy() {
        this.enemies.children.iterate((enemy) => {
            // 화면 내 무작위 위치로 텔레포트
            enemy.setPosition(
                Phaser.Math.Between(100, 580), // 무작위 X
                Phaser.Math.Between(100, 100)   // 무작위 Y
            );

            if (enemy.active) {
                for (let angle = -30; angle <= 30; angle += 15) {
                    const bullet = this.enemyBullets.create(enemy.x - 20, enemy.y, 'stone_bullet');
                    const velocity = new Phaser.Math.Vector2(50, 500).rotate(Phaser.Math.DegToRad(angle));
                    bullet.setVelocity(velocity.x, velocity.y);
                    bullet.setScale(0.2);
                    bullet.setCollideWorldBounds(true);
                    bullet.body.onWorldBounds = true; // 꼭 필요!
                }
            }
        });
    }

    shootPlayerBullet() {
        if (this.spaceKeyDown && !this.gameOver) {
            const straightBullet = this.playerBullets.create(this.player.x, this.player.y + 20, 'bullet');
            straightBullet.setVelocityY(-1000);
            straightBullet.setScale(0.2);

            // 레벨업 시 탄막 추가(예정)
            /*
            const leftBullet = this.playerBullets.create(this.player.x, this.player.y + 20, 'bullet');
            leftBullet.setVelocity(-200, -1500);
            leftBullet.setScale(0.1);

            const rightBullet = this.playerBullets.create(this.player.x, this.player.y + 20, 'bullet');
            rightBullet.setVelocity(200, -1500);
            rightBullet.setScale(0.1);
            */
        }
    }

    handleBulletHit(bullet, enemy) {
        // 적 체력 감소
        this.enemyHP -= 1;
        this.updateEnemyHPBar();

        if (this.enemyHP <= 0) {
            if (this.playerHP === 10)
                this.playerHP = 120; // 게임 오버 연출 중복 실행 방지
            enemy.destroy();
            this.cameras.main.flash(1000, 0, 0, 0);
            setTimeout(() => {
                this.scene.start('MidPartScene');
            }, 500);
        }
    }

    handlePlayerHit(player, bullet) {
        bullet.destroy();
    
        // **1초 동안 화면이 빨갛게 번쩍임 (플레이어 피격 연출)**
        this.cameras.main.flash(1000, 255, 0, 0);
    
        // 플레이어 체력 감소
        this.playerHP -= 10;
        this.updatePlayerHPBar();
    
        if (this.playerHP <= 0) {
            // **게임 오버 연출 시작**
            this.gameOverSequence();
        }
    }
    
    gameOverSequence() {
        this.gameOver = true;

        // **모든 게임 요소 제거 및 충돌 처리 중지**
        this.physics.pause();  // 물리 엔진 정지
        this.player.setVisible(false);  // 플레이어 숨기기
        this.playerHitbox.setVisible(false); // 플레이어 피탄 판정 숨기기
        this.playerHitboxBorder.setVisible(false);
        this.enemies.clear(true, true); // 적 제거
        this.enemyHPBar.setVisible(false);
        this.playerBullets.clear(true, true); // 플레이어 탄막 제거
        this.enemyBullets.clear(true, true); // 적 탄막 제거
    
        // 배경 변경: 게임 오버 화면으로 설정
        this.background.setVisible(false);
        this.backgroundUI.setTexture('gameover');

        this.sound.add('Jaemin_laugh').setVolume(0.3).play();
    
        setTimeout(() => {
            window.location.reload();
        }, 2800);
    } 

    update() {
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
    }

}



