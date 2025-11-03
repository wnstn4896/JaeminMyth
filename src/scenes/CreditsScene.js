export class CreditsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CreditsScene' });
    }

    create() {
        // 로드된 이미지를 배경으로 추가
        this.title = this.physics.add.sprite(640, 350, 'title1');

        // 애니메이션 프레임 처리
        const MTEFrames = [];
        for (let i=1; i <= 7; i++)
            MTEFrames.push({ key: 'Jaemin_MTE' + i });

        this.anims.create({
            key: 'MTE',
            frames: MTEFrames,
            frameRate: 12,
            repeat: -1
        });

        this.dancerLeft = this.physics.add.sprite(200, 400, 'Jaemin_MTE');
        this.dancerLeft.setScale(0.5);
        this.dancerLeft.anims.play('MTE');

        // 오른쪽 댄서
        this.dancerRight = this.physics.add.sprite(1080, 400, 'Jaemin_MTE');
        this.dancerRight.setScale(0.5);
        this.dancerRight.anims.play('MTE');

        this.bgm = this.sound.add('MTEWorld', { loop: true });
        this.bgm.setVolume(0.3).play();

        // STAFF 목록
        this.staffList = [
            { role: 'PROGRAMMING', name: 'JUNSU SHIN' },
            { role: 'ART & STORY Director', name: 'GWANU JO' }
        ];

        this.currentIndex = 0;

        // 일정 시간마다 다음 STAFF 표시
        this.time.addEvent({
            delay: 2000,
            callback: this.showNextStaff,
            callbackScope: this,
            loop: true
        });
    }

     showNextStaff() {
        if (this.currentIndex >= this.staffList.length) {
            // 모든 STAFF 표시 후: 장면 전환 or 크레딧 종료
            this.time.delayedCall(1000000, () => {
                window.location.reload();
            });
            return;
        }

        const { role, name } = this.staffList[this.currentIndex];

        // 처음에는 화면 아래쪽에서 시작
        const text = this.add.text(640, 700, `${role}\n ${name}`, {
            fontFamily: 'HeirofLightBold',
            fontSize: '36px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Tween으로 위로 올라가며 페이드아웃
        this.tweens.add({
            targets: text,
            y: 300,         // 올라가는 위치
            alpha: { from: 1, to: 0 },
            duration: 3000,
            ease: 'Sine.easeInOut',
            onComplete: () => text.destroy()
        });

        this.currentIndex++;
    }
}
