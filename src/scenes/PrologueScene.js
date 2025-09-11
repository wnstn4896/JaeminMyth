import { VisualNovelModule } from './VisualNovelModule.js';

export class PrologueScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PrologueScene' });
        this.dialogues = [
            {
                text: "내 이름은 오프니온.",
                character: 'openion_face_default',
                name: '오프니온',
                background: null,
            },
            {
                text: "우리나라인 '루펠프'는 십여 년 전 어떤 나라와의 전쟁에서 승리했다고 한다.",
                character: 'openion_face_default',
                name: '오프니온',
                background: null,
            },
            {
                text: "그 나라에 대한 역사와 기록은 모조리 말소된 데다가, 그 나라의 주요 인물은 전쟁이 끝나고 전부 숙청되어 그 나라에 대해 알고 있는 사람은 없다고 한다. 뭐, 그렇기에 나도 모른다.",
                character: 'openion_face_default',
                name: '오프니온',
                background: null,
            },
            {
                text: "너무 어릴 때 이야기라서 기억은 없긴 하지만, 우리 가족은 모두 그 전쟁 중에 희생됐다고 한다. 따라서 난 혼자다.",
                character: 'openion_face_default',
                name: '오프니온',
                background: null,
            },
            {
                text: "하지만, 나에게 일어난 불가사의한 현상이 있다. 내가 중학교에 다닐 무렵부터 내 눈앞에 나를 닮은 여자가 갑자기 나타났다. 아니, 정확히는 또 다른 내 몸이라고 해야 되는 걸까…?",
                character: 'openion_face_default',
                name: '오프니온',
                background: null,
            },
            {
                text: "그 몸은 내 의지대로 움직이는데, 사람이 조작하는 기계 같은 개념이 아니라 진짜 사람 몸이다. 만약 내가 여자로 태어났다면 이렇게 생겼겠다 싶은 모습이다.",
                character: 'openion_face_default',
                name: '오프니온',
                background: null,
            },
            {
                text: "게다가, 그 몸으로는 이상한 초능력도 구사할 수 있다.",
                character: 'openion_face_default',
                name: '오프니온',
                background: null,
            },
            {
                text: "아무튼, 나 같은 사람이 세상에 또 없는 데다 현대 과학으로는 도저히 이해가 안 되는 현상이라 내 새로운 두 번째 몸에 대한 사실은 남들에게 숨기며 살아가고 있다.",
                character: 'openion_face_default',
                name: '오프니온',
                background: null,
            },
            {
                text: "그리고, 현재.",
                character: 'openion_face_default',
                name: '오프니온',
                background: null,
            },
            {
                text: "어느 날부터, 수많은 사람들이 실종되는 사건이 루펠프 내에서 연달아 발생하고 있다. 그중 여자들은 끝내 시신으로 발견되는 경우가 있는가 하면, 남자들은 실종된 채 아무런 흔적도 없이 나타나지 않고 있다.",
                character: 'openion_face_default',
                name: '오프니온',
                background: null,
            },
            {
                text: "경찰과 국립 중앙연구원이 협력하여 수사를 진행하고 있지만, 이 무슨 일인지… 현실적으로 설명되지 않는 모순적인 현상만이 발견될 뿐, 사건의 경위는 파악이 안 되고 있다.",
                character: 'openion_face_default',
                name: '오프니온',
                background: null,
            },
            {
                text: "최근 연달아 발생하고 있는 대규모 실종 사건이 화제가 된 가운데, 오늘도 루펠프 수도 호수공원 인근에서 실종됐던 여성들의 시신이 발견됐다고 합니다. 현장에서 보도합니다.",
                character: 'reporter_face',
                name: '기자',
                background: 'openion_house',
            },
            {
                text: "이곳은 수도 호수공원 인근의 사건 현장입니다. 경찰과 루펠프 국립 중앙연구원에서 파견된 의학 분야 과학수사 협조인이 이곳에서 발견된 11구의 시신을 부검하여 사건 경위를 조사하고 있습니다.",
                character: 'reporter_face',
                name: '기자',
                background: 'openion_house',
            },
            {
                text: "뭐..?! 수도 호수공원 인근이면 이 주변인데...?  가봐야 할까?",
                character: 'openion_face_default',
                name: '오프니온',
                background: 'openion_house',
                choices: [
                    {
                        text: "사건 현장에 가본다",
                        action: () => { this.choiceResult = "going"; }
                    },
                    {
                        text: "가지 않는다",
                        action: () => { this.choiceResult = "notGoing"; }
                    },
                ],
            },
            // '가지 않는다' 선택 시 - Index 14
            {
                text: "그래. 내가 무슨 권한이 있다고 거길 가? 그냥 신경 끄자. 이 사건이 나의 이 두 번째 몸에 대한 진실에 연관되어 있다고 단정 짓기도 어렵고 말이야",
                character: 'openion_face_default',
                name: '오프니온',
                background: 'openion_house',
            },
            {
                text: "그렇게 몇 년 후에도 계속해서 루펠프 사람들이 대거 실종되고 있다. 사건 해결에 대한 실마리와 범인에 대한 증거는 전혀 찾지 못한 채, 앞으로도 계속 발생할 것이다.",
                character: null,
                name: '나레이션',
                background: 'gameover',
            },
            // '사건 현장에 가본다' 선택 시 - Index 16
            {
                text: "그래. 나에게 새로 생긴 이 두 번째 몸으로 가봐야겠어. 어쩌면 내가 이 사건을 해결할 열쇠일지도 모르는 거니까.",
                character: 'openion2_face_default',
                name: '오프니온(두 번째 몸)',
                background: 'openion_house',
            },
        ];
        this.currentIndex = 0;
        this.choiceResult = null;
    }

    create() {
        this.visualNovelModule = new VisualNovelModule(this);
        this.visualNovelModule.createUI();
        this.onNextDialogue();
    }

    onNextDialogue() {
        // 대사 출력 진행
        if (this.currentIndex < this.dialogues.length) {
            const dialogue = this.dialogues[this.currentIndex];
            this.visualNovelModule.updateDialogue(dialogue, () => {
                this.currentIndex++;
                this.onNextDialogue();
            });
        } else {
            this.endScene();
        }
    }
    
    endScene() {
        this.scene.stop('PrologueScene');
        this.scene.start('ShooterScene');
    }
    
}
