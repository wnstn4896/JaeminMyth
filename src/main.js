import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { PrologueScene } from './scenes/PrologueScene.js';
import { LoadingScene } from './scenes/LoadingScene.js';
import { StageSelectScene } from './scenes/StageSelectScene.js';
import { Stage1BattleScene } from './scenes/Stage1BattleScene.js';
import { Stage2BattleScene } from './scenes/Stage2BattleScene.js';
import { Stage3BattleScene } from './scenes/Stage3BattleScene.js';

import { CreditsScene } from './scenes/CreditsScene.js';

document.oncontextmenu = function(e) { return false; }

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    transparent: true, // 캔버스 배경을 투명하게 설정
    scene: [BootScene, TitleScene, PrologueScene, LoadingScene, Stage1BattleScene, Stage2BattleScene, Stage3BattleScene, StageSelectScene, CreditsScene], // 모든 Scene 등록
    scale: {
        mode: Phaser.Scale.FIT, // 디바이스 화면에 맞게 비율 조정
        autoCenter: Phaser.Scale.CENTER_BOTH, // 화면 중앙 정렬
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false,
        },
    },
    input: {
        activePointers: 3, // 최대 3개의 동시 입력 허용
    },
};

new Phaser.Game(config);
