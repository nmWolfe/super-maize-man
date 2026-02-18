import Phaser from "phaser";
import { SCENES, COLORS } from "../utils/constants";

export class GameOverScene extends Phaser.Scene {
  private won: boolean = false;
  private fromBoss: boolean = false;

  constructor() {
    super(SCENES.GAME_OVER);
  }

  init(data: { won: boolean; fromBoss?: boolean }) {
    this.won = data.won ?? false;
    this.fromBoss = data.fromBoss ?? false;
  }

  create() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    let message: string;
    if (this.fromBoss && this.won) {
      message = "BIG KEITH HAS BEEN DEFEATED.\nGerald is devastated. Dave is confused.\nThe National Farmers Union has been notified.\nYou are free. For now.";
    } else if (this.won) {
      message = 'Well, I must say, that performance was a-MAIZE-ing.\nI can honestly say I have never seen anyone\ncomplete this game. Ever.\nMay I a-corn-pany you on a replay?';
    } else {
      message = "Well, that's a shame. You tried, but failed.\nThese things happen in life, kid.\nKeep your chin up, turn that CORN-er,\nand try again.";
    }

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
    replayText.on("pointerdown", () => this.goToMenu());


    if (this.input.keyboard) {
      this.input.keyboard.once("keydown-ENTER", () => this.goToMenu());
    }
  }

  private goToMenu() {
    const cornDisplay = document.querySelector(".corn-counter") as HTMLInputElement;
    if (cornDisplay) cornDisplay.value = "0 :";
    this.scene.start(SCENES.MENU);
  }
}
