import Phaser from "phaser";
import { SCENES } from "../utils/constants";
import { generateLevel } from "../data/MazeGenerator";

export class EndlessMenuScene extends Phaser.Scene {
  private seed: number = 0;
  private seedText!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENES.ENDLESS_MENU);
  }

  create() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Generate a random seed on entry
    this.seed = (Date.now() & 0xffff) + 1; // 1–65535

    // Header
    this.add.text(centerX, centerY - 120, "ENDLESS MODE", {
      fontFamily: "Pacifico, Tahoma",
      fontSize: "28px",
      color: "#ffea00",
      align: "center",
    }).setOrigin(0.5);

    // Flavour
    this.add.text(centerX, centerY - 70, "Procedural mazes. No mercy.", {
      fontFamily: '"Josefin Sans", Tahoma',
      fontSize: "13px",
      color: "#aaaaaa",
      align: "center",
    }).setOrigin(0.5);

    // Seed display
    this.add.text(centerX, centerY - 20, "Seed:", {
      fontFamily: '"Josefin Sans", Tahoma',
      fontSize: "13px",
      color: "#ffffff",
      align: "center",
    }).setOrigin(0.5);

    this.seedText = this.add.text(centerX, centerY + 14, this.formatSeed(), {
      fontFamily: "Pacifico, Tahoma",
      fontSize: "26px",
      color: "#ffea00",
      align: "center",
    }).setOrigin(0.5);

    // Arrow hint
    this.add.text(centerX, centerY + 50, "◄  ►  to change seed", {
      fontFamily: '"Josefin Sans", Tahoma',
      fontSize: "11px",
      color: "#666666",
      align: "center",
    }).setOrigin(0.5);

    // Start prompt
    const startText = this.add.text(centerX, centerY + 90, "Press Enter or tap to start", {
      fontFamily: "Pacifico, Tahoma",
      fontSize: "15px",
      color: "#ffea00",
      align: "center",
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.35,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    // Back hint
    this.add.text(centerX, centerY + 130, "Esc — back to menu", {
      fontFamily: '"Josefin Sans", Tahoma',
      fontSize: "11px",
      color: "#555555",
      align: "center",
    }).setOrigin(0.5);

    // Pointer tap to start
    this.input.on("pointerdown", (_ptr: unknown, _go: unknown, event: Phaser.Types.Input.EventData) => {
      void event;
      this.startEndless();
    });

    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-ENTER", () => this.startEndless());
      this.input.keyboard.on("keydown-LEFT",  () => this.changeSeed(-1));
      this.input.keyboard.on("keydown-RIGHT", () => this.changeSeed(1));
      this.input.keyboard.on("keydown-A",     () => this.changeSeed(-1));
      this.input.keyboard.on("keydown-D",     () => this.changeSeed(1));
      this.input.keyboard.once("keydown-ESC", () => {
        this.scene.start(SCENES.MENU);
      });
    }
  }

  private formatSeed(): string {
    return String(this.seed).padStart(5, "0");
  }

  private changeSeed(delta: number) {
    this.seed = ((this.seed - 1 + delta + 65535) % 65535) + 1;
    this.seedText.setText(this.formatSeed());
  }

  private startEndless() {
    const level = generateLevel(this.seed, 1);
    this.scene.start(SCENES.GAME, {
      proceduralLevel: level,
      runLevel: 1,
      seed: this.seed,
      totalCorn: 0,
    });
  }
}
