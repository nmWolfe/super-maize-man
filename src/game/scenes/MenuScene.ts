import Phaser from "phaser";
import { SCENES } from "../utils/constants";

type Mode = "story" | "endless";

export class MenuScene extends Phaser.Scene {
  private selectedMode: Mode = "story";
  private modeLabels!: { story: Phaser.GameObjects.Text; endless: Phaser.GameObjects.Text };

  constructor() {
    super(SCENES.MENU);
  }

  create() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    const rulesText =
      'Welcome to the MAIZE.\n' +
      '"That\'s a very clever play on words" I hear you say.\n' +
      'Well, I agree.\n' +
      'But this isn\'t about me, it\'s about you!\n' +
      'You are a Corn person who loves gathering corn.\n' +
      'Collect all the delicious corns before the timer runs out.\n' +
      'Watch out for Gerald.';

    this.add.text(centerX, centerY - 80, rulesText, {
      fontFamily: '"Josefin Sans", Tahoma',
      fontSize: "13px",
      color: "#ffffff",
      align: "center",
      lineSpacing: 5,
      wordWrap: { width: this.scale.width - 40 },
    }).setOrigin(0.5);

    // Mode selector
    this.add.text(centerX, centerY + 30, "Mode:", {
      fontFamily: '"Josefin Sans", Tahoma',
      fontSize: "12px",
      color: "#888888",
      align: "center",
    }).setOrigin(0.5);

    const storyLabel = this.add.text(centerX - 60, centerY + 55, "Story", {
      fontFamily: "Pacifico, Tahoma",
      fontSize: "18px",
      color: "#ffea00",
      align: "center",
    }).setOrigin(0.5);

    const endlessLabel = this.add.text(centerX + 60, centerY + 55, "Endless", {
      fontFamily: "Pacifico, Tahoma",
      fontSize: "18px",
      color: "#555555",
      align: "center",
    }).setOrigin(0.5);

    this.modeLabels = { story: storyLabel, endless: endlessLabel };
    this.updateModeDisplay();

    // Arrow hint
    this.add.text(centerX, centerY + 80, "◄  ►  to switch", {
      fontFamily: '"Josefin Sans", Tahoma',
      fontSize: "10px",
      color: "#555555",
      align: "center",
    }).setOrigin(0.5);

    const startText = this.add.text(centerX, centerY + 110, "Press Enter or tap to start", {
      fontFamily: "Pacifico, Tahoma",
      fontSize: "15px",
      color: "#ffea00",
      align: "center",
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.4,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-LEFT",  () => this.switchMode("story"));
      this.input.keyboard.on("keydown-RIGHT", () => this.switchMode("endless"));
      this.input.keyboard.on("keydown-A",     () => this.switchMode("story"));
      this.input.keyboard.on("keydown-D",     () => this.switchMode("endless"));
      this.input.keyboard.once("keydown-ENTER", () => this.startSelected());
    }

    this.input.once("pointerdown", () => this.startSelected());

    // Tap on labels
    storyLabel.setInteractive({ useHandCursor: true })
      .on("pointerdown", () => { this.switchMode("story"); this.startSelected(); });
    endlessLabel.setInteractive({ useHandCursor: true })
      .on("pointerdown", () => { this.switchMode("endless"); this.startSelected(); });
  }

  private switchMode(mode: Mode) {
    this.selectedMode = mode;
    this.updateModeDisplay();
  }

  private updateModeDisplay() {
    this.modeLabels.story.setColor(this.selectedMode === "story" ? "#ffea00" : "#444444");
    this.modeLabels.endless.setColor(this.selectedMode === "endless" ? "#ffea00" : "#444444");
  }

  private startSelected() {
    if (this.selectedMode === "endless") {
      this.scene.start(SCENES.ENDLESS_MENU);
    } else {
      this.scene.start(SCENES.GAME, { levelIndex: 0, totalCorn: 0 });
    }
  }
}
