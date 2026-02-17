import Phaser from "phaser";
import { SCENES, COLORS } from "../utils/constants";

export class GameOverScene extends Phaser.Scene {
  private won: boolean = false;

  constructor() {
    super(SCENES.GAME_OVER);
  }

  init(data: { won: boolean }) {
    this.won = data.won ?? false;
  }

  create() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    const message = this.won
      ? 'Well, I must say, that performance was a-MAIZE-ing.\nI can honestly say I have never seen anyone\ncomplete this game. Ever.\nMay I a-corn-pany you on a replay?'
      : "Well, that's a shame. You tried, but failed.\nThese things happen in life, kid.\nKeep your chin up, turn that CORN-er,\nand try again.";

    this.add.text(centerX, centerY - 60, message, {
      fontFamily: '"Josefin Sans", Tahoma',
      fontSize: "16px",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: this.scale.width - 40 },
    }).setOrigin(0.5);

    // Replay button
    const replayText = this.add.text(centerX, centerY + 80, "Replay", {
      fontFamily: "Pacifico, Tahoma",
      fontSize: "24px",
      color: "#ffffff",
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5);

    // Neon border around replay button
    const bounds = replayText.getBounds();
    const border = this.add.graphics();
    border.lineStyle(2, COLORS.SECONDARY, 1);
    border.strokeRoundedRect(
      bounds.x - 10,
      bounds.y - 5,
      bounds.width + 20,
      bounds.height + 10,
      10
    );

    replayText.setInteractive({ useHandCursor: true });
    replayText.on("pointerdown", () => {
      // Reset corn counter in DOM
      const cornDisplay = document.querySelector(".corn-counter") as HTMLInputElement;
      if (cornDisplay) cornDisplay.value = "";
      this.scene.start(SCENES.GAME, { levelIndex: 0, totalCorn: 0 });
    });

    // Also allow Enter key to replay
    if (this.input.keyboard) {
      this.input.keyboard.once("keydown-ENTER", () => {
        const cornDisplay = document.querySelector(".corn-counter") as HTMLInputElement;
        if (cornDisplay) cornDisplay.value = "";
        this.scene.start(SCENES.GAME, { levelIndex: 0, totalCorn: 0 });
      });
    }
  }
}
