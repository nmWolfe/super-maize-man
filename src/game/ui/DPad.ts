import Phaser from "phaser";

export type DPadDirection = "up" | "down" | "left" | "right";

export class DPad {
  private scene: Phaser.Scene;
  private buttons: Map<DPadDirection, Phaser.GameObjects.Image> = new Map();
  private onDirection: (dir: DPadDirection) => void;

  constructor(scene: Phaser.Scene, onDirection: (dir: DPadDirection) => void) {
    this.scene = scene;
    this.onDirection = onDirection;
    this.create();
  }

  private create() {
    const centerX = this.scene.scale.width / 2;
    const bottomY = this.scene.scale.height - 10;
    const spacing = 56;

    const dirs: { key: DPadDirection; texture: string; x: number; y: number }[] = [
      { key: "up", texture: "arrow-up", x: centerX, y: bottomY - spacing * 2 },
      { key: "down", texture: "arrow-down", x: centerX, y: bottomY },
      { key: "left", texture: "arrow-left", x: centerX - spacing, y: bottomY - spacing },
      { key: "right", texture: "arrow-right", x: centerX + spacing, y: bottomY - spacing },
    ];

    for (const dir of dirs) {
      const btn = this.scene.add.image(dir.x, dir.y, dir.texture);
      btn.setInteractive({ useHandCursor: true });
      btn.setAlpha(0.8);

      btn.on("pointerdown", () => {
        btn.setAlpha(1);
        btn.setScale(0.9);
        this.onDirection(dir.key);
      });
      btn.on("pointerup", () => {
        btn.setAlpha(0.8);
        btn.setScale(1);
      });
      btn.on("pointerout", () => {
        btn.setAlpha(0.8);
        btn.setScale(1);
      });

      this.buttons.set(dir.key, btn);
    }
  }

  setVisible(visible: boolean) {
    for (const btn of this.buttons.values()) {
      btn.setVisible(visible);
    }
  }
}
