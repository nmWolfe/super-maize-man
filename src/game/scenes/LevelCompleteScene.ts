import Phaser from "phaser";
import { SCENES } from "../utils/constants";
import { levels } from "../data/levels";

interface VignetteData {
  title: string;
  lines: string[];
}

export class LevelCompleteScene extends Phaser.Scene {
  private nextLevelIndex: number = 0;
  private totalCorn: number = 0;
  private vignette?: VignetteData;
  private seed?: number;
  private runLevel?: number;
  private endlessMode: boolean = false;

  constructor() {
    super(SCENES.LEVEL_COMPLETE);
  }

  init(data: {
    nextLevelIndex: number;
    totalCorn: number;
    vignette?: VignetteData;
    seed?: number;
    runLevel?: number;
    endlessMode?: boolean;
  }) {
    this.nextLevelIndex = data.nextLevelIndex;
    this.totalCorn = data.totalCorn;
    this.vignette = data.vignette;
    this.seed = data.seed;
    this.runLevel = data.runLevel;
    this.endlessMode = data.endlessMode ?? false;
  }

  create() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    if (this.vignette) {
      this.showVignette(centerX, centerY);
    } else {
      this.showLevelName(centerX, centerY);
    }
  }

  private showVignette(centerX: number, centerY: number) {
    const vignette = this.vignette!;

    // Semi-transparent background
    const bg = this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000000, 0.7);
    bg.setAlpha(0);
    this.tweens.add({ targets: bg, alpha: 1, duration: 300 });

    // Title
    const title = this.add.text(centerX, centerY - 80, vignette.title, {
      fontFamily: "Pacifico, Tahoma",
      fontSize: "22px",
      color: "#ffea00",
      align: "center",
      wordWrap: { width: this.scale.width - 60 },
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, duration: 400, delay: 200 });

    // Story lines — stagger 220ms apart
    const lineObjects: Phaser.GameObjects.Text[] = [];
    vignette.lines.forEach((line, i) => {
      const lineY = centerY - 20 + i * 28;
      const t = this.add.text(centerX, lineY, line, {
        fontFamily: '"Josefin Sans", Tahoma',
        fontSize: "13px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: this.scale.width - 60 },
      }).setOrigin(0.5).setAlpha(0);
      lineObjects.push(t);
      this.tweens.add({ targets: t, alpha: 1, duration: 300, delay: 400 + i * 220 });
    });

    // "Tap to continue" prompt — appears after all lines
    const totalDelay = 400 + vignette.lines.length * 220 + 300;
    const prompt = this.add.text(centerX, centerY + 110, "Tap or press Enter to continue", {
      fontFamily: "Pacifico, Tahoma",
      fontSize: "13px",
      color: "#ffea00",
      align: "center",
    }).setOrigin(0.5).setAlpha(0);

    this.time.delayedCall(totalDelay, () => {
      this.tweens.add({
        targets: prompt,
        alpha: 0.3,
        duration: 600,
        yoyo: true,
        repeat: -1,
      });
      this.enableAdvance();
    });
  }

  private showLevelName(centerX: number, centerY: number) {
    const levelName = levels[this.nextLevelIndex]?.name ?? "Next Level";

    const text = this.add.text(centerX, centerY, levelName, {
      fontFamily: "Pacifico, Tahoma",
      fontSize: "32px",
      color: "#ffea00",
      align: "center",
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: text,
      alpha: 1,
      duration: 400,
      yoyo: true,
      hold: 600,
      onComplete: () => this.advanceToGame(),
    });
  }

  private enableAdvance() {
    if (this.input.keyboard) {
      this.input.keyboard.once("keydown-ENTER", () => this.advanceToGame());
    }
    this.input.once("pointerdown", () => this.advanceToGame());
  }

  private advanceToGame() {
    if (this.endlessMode) {
      // Endless mode — GameScene will use the proceduralLevel passed fresh each time
      // but here we just pass seed + runLevel so GameScene can regenerate
      this.scene.start(SCENES.GAME, {
        seed: this.seed,
        runLevel: this.runLevel,
        totalCorn: this.totalCorn,
        endlessMode: true,
      });
    } else {
      this.scene.start(SCENES.GAME, {
        levelIndex: this.nextLevelIndex,
        totalCorn: this.totalCorn,
      });
    }
  }
}
