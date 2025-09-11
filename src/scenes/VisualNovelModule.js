export class VisualNovelModule {
    constructor(scene) {
        this.scene = scene;
        this.uiElements = {};
        this.choiceTexts = [];
        this.skipTimer = null;
        this.skipBlockedScenes = ["DefeatEndingScene", "TrueEndingScene"] || [];
        this.skipBlockedIndexes = []; // 특정 인덱스에서 스킵 제한 (기본은 빈 배열)

        // MidPartScene의 133번 이후 스킵 금지
        if (scene.scene.key === 'MidPartScene') {
            for (let i = 133; i <= 1000; i++) { // 133번부터 스킵 제한
                this.skipBlockedIndexes.push(i);
            }
        }
    }

    createUI() {
        const { scene } = this;
    
        // 배경
        this.uiElements.background = scene.add.image(scene.cameras.main.width / 2, scene.cameras.main.height / 2, '').setOrigin(0.5).setScale(scene.cameras.main.width / 1280, scene.cameras.main.height / 720);
    
        // 대화 상자
        this.uiElements.dialogBox = scene.add.graphics();
        this.uiElements.dialogBox.fillStyle(0x000000, 0.8);
        this.uiElements.dialogBox.fillRoundedRect(140, 500, 1000, 150, 20);
    
        // 캐릭터 이름 상자
        this.uiElements.nameBox = scene.add.graphics();
        this.uiElements.nameBox.fillStyle(0x000000, 0.8);
        this.uiElements.nameBox.fillRoundedRect(140, 460, 230, 40, 10);
    
        // 캐릭터 이름 텍스트
        this.uiElements.nameText = scene.add.text(150, 467, '', {
            fontSize: '20px',
            color: '#ffffff',
            padding: { top: 2, bottom: 2 },
        });
    
        // 캐릭터 스프라이트
        this.uiElements.characterSprite = scene.add.image(230, 575, '').setScale(0.4);
    
        // 대화 텍스트
        this.uiElements.dialogueText = scene.add.text(300, 540, '', {
            fontSize: '18px',
            color: '#ffffff',
            wordWrap: { width: 800 },
            padding: { top: 5, bottom: 2 },
        });
        this.uiElements.dialogueText.setLineSpacing(6); // 줄 간격 설정
    
        // "다음" 버튼
        this.uiElements.nextButton = scene.add.text(1000, 620, '다음 →', {
            fontSize: '20px',
            color: '#ffffff',
            padding: { top: 2, bottom: 2 },
        }).setInteractive().on('pointerover', () => {
            // 호버링 시 스타일 변경
            this.uiElements.nextButton.setStyle({
                color: 'gray', // 텍스트 색상 변경
            });
        })
        .on('pointerout', () => {
            // 호버링이 끝났을 때 원래 스타일 복구
            this.uiElements.nextButton.setStyle({
                color: '#ffffff', // 텍스트 색상 복구
            });
        });

        // "스킵" 버튼
        this.uiElements.skipButton = this.scene.add.text(800, 620, '스킵', {
            fontSize: '20px',
            color: '#ffffff',
            padding: { top: 2, bottom: 2 },
        }).setInteractive().setVisible(false)
        .on('pointerover', () => {
            this.uiElements.skipButton.setStyle({ color: 'gray' }); // 호버 스타일
        })
        .on('pointerout', () => {
            this.uiElements.skipButton.setStyle({ color: '#ffffff' }); // 기본 스타일 복구
        });

        this.DefeatLog = sessionStorage.getItem("DefeatLog") === "true";
        if (this.DefeatLog) {
            this.uiElements.skipButton.setVisible(true);
        }
    }
    
    updateDialogue(dialogue, onNext) {
        // 대사 배열을 담은 객체
        this.currentDialogue = dialogue;

        const { background, dialogBox, nameBox, nameText, characterSprite, dialogueText, nextButton, skipButton } = this.uiElements;
    
        // 배경 업데이트
        if (dialogue.background) {
            background.setTexture(dialogue.background).setVisible(true);
            this.scene.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
        } else {
            background.setVisible(false);
            this.scene.cameras.main.setBackgroundColor('#000000');
        }
    
        // 대화 상자 및 텍스트 업데이트
        dialogBox.setVisible(true);
        nameBox.setVisible(true);
        nameText.setText(dialogue.name).setVisible(true);
        characterSprite.setTexture(dialogue.character).setVisible(!!dialogue.character);
        dialogueText.setText(dialogue.text).setVisible(true);
    
        // 버튼 동작
        nextButton.setVisible(true);
    
        nextButton.off('pointerdown').on('pointerdown', () => {
            if (dialogue.choices) {
                this.showChoices(dialogue.choices, onNext);
            } else {
                onNext();
            }
        });
    
        // 스킵 버튼 조건 설정
        const sceneKey = this.scene.scene.key;
        const currentIndex = this.scene.currentIndex || 0; // 현재 대화 인덱스

        if (
            this.DefeatLog &&
            !this.skipBlockedScenes.includes(sceneKey) &&
            !this.skipBlockedIndexes.includes(currentIndex)
        ) {
            skipButton.setVisible(true);
            skipButton.off('pointerdown').on('pointerdown', () => {
                this.startSkipping(onNext);
            });
        } else {
            skipButton.setVisible(false);

            // 제한된 씬이라면 스킵 중지
            if (this.skipTimer) {
                clearInterval(this.skipTimer);
                this.skipTimer = null;
            }
        }
    }    
    
    startSkipping(onNext) {
        if (this.skipTimer) {
            // 이미 스킵 중이면 중지
            clearInterval(this.skipTimer);
            this.skipTimer = null;
            return;
        }
    
        const skipInterval = 100;
        this.skipTimer = setInterval(() => {
            const currentIndex = this.scene.currentIndex || 0;
            const sceneKey = this.scene.scene.key;
    
            // 스킵 불가능한 씬이나 인덱스면 중단
            if (this.skipBlockedScenes.includes(sceneKey) || this.skipBlockedIndexes.includes(currentIndex)) {
                clearInterval(this.skipTimer);
                this.skipTimer = null;
                return;
            }
    
            // 마지막 대사라면 스킵 중단
            if (currentIndex >= this.scene.dialogues.length - 2) {
                this.uiElements.skipButton.setVisible(false);
                clearInterval(this.skipTimer);
                this.skipTimer = null;
                return;
            }
    
            if (!this.scene.sys.isActive()) {
                clearInterval(this.skipTimer);
                this.skipTimer = null;
                return;
            }
    
            if (this.currentDialogue && this.currentDialogue.choices) {
                clearInterval(this.skipTimer);
                this.skipTimer = null;
                this.showChoices(this.currentDialogue.choices, onNext);
            } else {
                onNext();
            }
        }, skipInterval);
    }
    

    showChoices(choices, onNext) {
        const { scene } = this;
        this.hideUI(); // 기존 UI 숨기기

        // 스킵 중이라면 스킵 중단
        if (this.skipTimer) {
            clearInterval(this.skipTimer);
            this.skipTimer = null;
        }

        const centerX = scene.cameras.main.width / 2;
        const centerY = scene.cameras.main.height / 2;

        choices.forEach((choice, index) => {
            const choiceText = scene.add.text(centerX, centerY - 50 + index * 60, choice.text, {
                fontSize: '20px',
                color: '#ffffff',
                backgroundColor: '#333333',
                padding: { x: 20, y: 10 },
            }).setOrigin(0.5).setInteractive();

            choiceText.on('pointerdown', () => {
                choice.action();
                this.clearChoices();
                onNext(); // 선택 후 다음 대화 진행
            });

            this.choiceTexts.push(choiceText);
        });
    }

    hideUI() {
        Object.values(this.uiElements).forEach((el) => el.setVisible(false));
    }

    restoreUI() {
        const { background, dialogBox, nameBox, nameText, characterSprite, dialogueText, nextButton } = this.uiElements;
        background.setVisible(true);
        dialogBox.setVisible(true);
        nameBox.setVisible(true);
        nameText.setVisible(true);
        characterSprite.setVisible(true);
        dialogueText.setVisible(true);
        nextButton.setVisible(true);
    }
    
    clearChoices() {
        this.choiceTexts.forEach((text) => text.destroy());
        this.choiceTexts = [];
    }
}
