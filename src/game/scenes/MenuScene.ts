import Phaser from "phaser";
import { SCENES } from "../utils/constants";

export class MenuScene extends Phaser.Scene {
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
      'Your task is to collect all the delicious corns\n' +
      'before the timer runs out.\n' +
      'If the timer runs out, goodbye my sweet friend,\n' +
      'I\'ll see you in the theatres.';

    this.add.text(centerX, centerY - 40, rulesText, {
      fontFamily: '"Josefin Sans", Tahoma',
      fontSize: "14px",
      color: "#ffffff",
      align: "center",
      lineSpacing: 6,
      wordWrap: { width: this.scale.width - 40 },
    }).setOrigin(0.5);

    const startText = this.add.text(centerX, centerY + 120, "Press Enter or tap to start", {
      fontFamily: "Pacifico, Tahoma",
      fontSize: "16px",
      color: "#ffea00",
      align: "center",
    }).setOrigin(0.5);

    // Pulsing animation on start prompt
    this.tweens.add({
      targets: startText,
      alpha: 0.4,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Start on Enter key
    if (this.input.keyboard) {
      this.input.keyboard.once("keydown-ENTER", () => {
        this.startGame();
      });
    }

    // Start on any pointer tap
    this.input.once("pointerdown", () => {
      this.startGame();
    });
  }

  private startGame() {
    this.scene.start(SCENES.GAME, { levelIndex: 0, totalCorn: 0 });
  }
}
