const CHARACTER_CONFIG = {
    '재민(가명)': {
        texture: 'Jaemin_front',
        x: 100,
        y: 720,
        scale: 0.4,
        flipX: false,
    }
};

export class MessageModule {
    constructor(scene) {
        this.scene = scene;
        this.uiElements = {};
    }

    createUI() {
        const { scene } = this;

        // 배경
        this.uiElements.background = scene.add.image(scene.cameras.main.width / 2, scene.cameras.main.height / 2, '').setOrigin(0.5).setScale(scene.cameras.main.width / 1280, scene.cameras.main.height / 720);

        // 캐릭터 스프라이트 (기본 비활성)
        this.uiElements.characterSprite = scene.add
            .image(0, 0, '')
            .setOrigin(0.5, 1)
            .setVisible(false)

        // 대화 상자
        this.uiElements.dialogBox = scene.add.graphics();
        this.uiElements.dialogBox.fillStyle(0x000000, 0.8);
        this.uiElements.dialogBox.fillRoundedRect(140, 500, 700, 150, 20);
        this.uiElements.dialogBox.lineStyle(5, 0xffffff, 0.8);
        this.uiElements.dialogBox.strokeRoundedRect(140, 500, 1000, 150, 20); // 테두리 그리기

        // 대화 상자에 클릭 이벤트 추가 (Interactive 설정)
        this.uiElements.dialogBox.setInteractive(new Phaser.Geom.Rectangle(140, 500, 1000, 150), Phaser.Geom.Rectangle.Contains);

        // 대화 상자 클릭 시 호출될 이벤트
        this.uiElements.dialogBox.on('pointerdown', this.onClick.bind(this));

        // 캐릭터 이름 상자
        this.uiElements.nameBox = scene.add.graphics();
        this.uiElements.nameBox.fillStyle(0x000000, 0.8);
        this.uiElements.nameBox.fillRoundedRect(140, 460, 230, 40, 10);
        this.uiElements.nameBox.lineStyle(3, 0xffffff, 0.8);
        this.uiElements.nameBox.strokeRoundedRect(140, 460, 230, 40, 10); // 테두리 그리기

        // 캐릭터 이름 텍스트
        this.uiElements.nameText = scene.add.text(150, 467, '', {
            fontFamily: 'HeirofLightBold',
            fontSize: '20px',
            color: '#ffffff',
            padding: { top: 2, bottom: 2 },
        });

        // 대화 텍스트
        this.uiElements.dialogueText = scene.add.text(200, 540, '', {
            fontSize: '18px',
            fontFamily: 'HeirofLightRegular',
            color: '#ffffff',
            wordWrap: { width: 800 },
            padding: { top: 5, bottom: 2 },
        });
        this.uiElements.dialogueText.setLineSpacing(6); // 줄 간격 설정

        // 대화창 조작 안내 텍스트
        this.uiElements.controlsText = scene.add.text(910, 620, '(Press [SPACE] OR Click)', {
            fontSize: '16px',
            fontFamily: 'HeirofLightRegular',
            color: '#ffffff',
            padding: { top: 2, bottom: 2 },
        });

        // 키 이벤트
        this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    // 대화창 클릭 시 호출되는 함수
    onClick() {
        this.onNext();
    }

    // 기본 대화창 스타일
    defaultBox(){
        this.uiElements.dialogBox.fillStyle(0x000000, 0.8);
        this.uiElements.dialogBox.fillRoundedRect(140, 500, 1000, 150, 20);
        this.uiElements.dialogBox.lineStyle(5, 0xffffff, 0.8);
        this.uiElements.dialogBox.strokeRoundedRect(140, 500, 1000, 150, 20);
        this.uiElements.nameBox.fillStyle(0x000000, 0.8);
        this.uiElements.nameBox.fillRoundedRect(140, 460, 230, 40, 10);
        this.uiElements.nameBox.lineStyle(3, 0xffffff, 0.8);
        this.uiElements.nameBox.strokeRoundedRect(140, 460, 230, 40, 10);
        this.uiElements.dialogueText.setStyle({ color: '#ffffff'});
        this.uiElements.controlsText.setStyle({ color: '#ffffff'});
        this.uiElements.nameText.setStyle({color: '#ffffff'});
    }

    updateDialogue(dialogue, onNext) {
        // 대사 배열을 담은 객체
        this.currentDialogue = dialogue;
        this.onNext = onNext;

        const { background, dialogBox, nameBox, nameText, dialogueText, controlsText, characterSprite } = this.uiElements;

        // 배경 업데이트
        if (dialogue.background) {
            background.setTexture(dialogue.background).setVisible(true);
            this.scene.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
        } else {
            background.setVisible(false);
            // this.scene.cameras.main.setBackgroundColor('#000000');
        }

        // 대화 상자 및 텍스트 업데이트
        dialogBox.setVisible(true);
        dialogueText.setText(dialogue.text).setVisible(true);

        // 캐릭터 이름 정의하지 않았으면 캐릭터 이름 상자 및 이름 텍스트 비활성화
        if (dialogue.name) {
            nameBox.setVisible(true);
            nameText.setText(dialogue.name).setVisible(true);
        } else {
            this.defaultBox();
            nameBox.setVisible(false);
            nameText.setVisible(false);
        }

        this.uiElements.dialogBox.clear();
        this.uiElements.nameBox.clear();

        this.defaultBox();
        
        // 캐릭터 스프라이트 처리
        const characterConfig = CHARACTER_CONFIG[dialogue.name];
        if (characterConfig) {
            characterSprite
                .setTexture(characterConfig.texture)
                .setPosition(characterConfig.x, characterConfig.y)
                .setScale(characterConfig.scale)
                .setFlipX(characterConfig.flipX ?? false)
                .setVisible(true);
        } else {
            characterSprite.setVisible(false);
        }

        // 이전 키 리스너 제거 (중복 방지)
        if (this.spaceKeyListener) {
            this.spaceKey.off('down', this.spaceKeyListener);
        }
        // 새로운 키 리스너 등록
        this.spaceKeyListener = () => {
            this.onNext();
        };
        this.spaceKey.on('down', this.spaceKeyListener);
    }

    hideUI() {
        Object.values(this.uiElements).forEach((el) => el.setVisible(false));

        // SPACE 키 리스너 제거
        if (this.spaceKeyListener) {
            this.spaceKey.off('down', this.spaceKeyListener);
            this.spaceKeyListener = null;
        }

        // 클릭 이벤트 리스너 제거
        this.uiElements.dialogBox.off('pointerdown', this.onClick);
    }

    restoreUI() {
        const { background, nameBox, dialogBox, dialogueText, controlsText } = this.uiElements;
        background.setVisible(true);
        nameBox.setVisible(true);
        dialogBox.setVisible(true);
        dialogueText.setVisible(true);
        controlsText.setVisible(true);
    }
}
