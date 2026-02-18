import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { LevelCompleteScene } from "./scenes/LevelCompleteScene";
import { GameOverScene } from "./scenes/GameOverScene";
import { EndlessMenuScene } from "./scenes/EndlessMenuScene";
import { BossScene } from "./scenes/BossScene";
import { COLORS } from "./utils/constants";

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-canvas",
  backgroundColor: COLORS.BACKGROUND,
  antialias: true,
  roundPixels: false,
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: "game-canvas",
    width: 480,
    height: 480,
  },
  scene: [BootScene, MenuScene, EndlessMenuScene, GameScene, BossScene, LevelCompleteScene, GameOverScene],
};
