import Phaser from "phaser";
import { SCENES } from "../utils/constants";
import { levels } from "../data/levels";

export class LevelCompleteScene extends Phaser.Scene {
  private nextLevelIndex: number = 0;
  private totalCorn: number = 0;

  constructor() {
    super(SCENES.LEVEL_COMPLETE);
  }

  init(data: { nextLevelIndex: number; totalCorn: number }) {
    this.nextLevelIndex = data.nextLevelIndex;
    this.totalCorn = data.totalCorn;
  }

  create() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    const levelName = levels[this.nextLevelIndex]?.name ?? "Next Level";

    const text = this.add.text(centerX, centerY, levelName, {
      fontFamily: "Pacifico, Tahoma",
      fontSize: "32px",
      color: "#ffea00",
      align: "center",
    }).setOrigin(0.5).setAlpha(0);

    // Fade in level name, then transition to game
    this.tweens.add({
      targets: text,
      alpha: 1,
      duration: 400,
      yoyo: true,
      hold: 600,
      onComplete: () => {
        this.scene.start(SCENES.GAME, {
          levelIndex: this.nextLevelIndex,
          totalCorn: this.totalCorn,
        });
      },
    });
  }
}
