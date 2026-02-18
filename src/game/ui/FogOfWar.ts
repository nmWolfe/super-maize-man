import Phaser from "phaser";
import { COLORS } from "../utils/constants";

export class FogOfWar {
  private graphics: Phaser.GameObjects.Graphics;
  private gridSize: number;
  private offsetX: number;
  private offsetY: number;
  private tileSize: number;
  private revealRadius: number;

  constructor(
    scene: Phaser.Scene,
    gridSize: number,
    offsetX: number,
    offsetY: number,
    tileSize: number,
    revealRadius: number
  ) {
    this.gridSize = gridSize;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.tileSize = tileSize;
    this.revealRadius = revealRadius;

    this.graphics = scene.add.graphics();
    this.graphics.setDepth(100);
  }

  update(playerRow: number, playerCol: number) {
    this.graphics.clear();

    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        // Chebyshev distance: max of row and col offsets
        const dist = Math.max(
          Math.abs(row - playerRow),
          Math.abs(col - playerCol)
        );

        if (dist > this.revealRadius) {
          // Fully fogged — matches canvas background so hidden tiles disappear
          this.graphics.fillStyle(COLORS.BACKGROUND, 1);
          this.fillTile(row, col);
        } else if (dist === this.revealRadius) {
          // Soft edge for a gradual reveal effect
          this.graphics.fillStyle(COLORS.BACKGROUND, 0.65);
          this.fillTile(row, col);
        }
        // dist < revealRadius: fully visible, draw nothing
      }
    }
  }

  private fillTile(row: number, col: number) {
    const x = this.offsetX + col * this.tileSize;
    const y = this.offsetY + row * this.tileSize;
    this.graphics.fillRect(x, y, this.tileSize, this.tileSize);
  }

  destroy() {
    this.graphics.destroy();
  }
}
