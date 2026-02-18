import Phaser from "phaser";
import { TILE } from "../utils/constants";

/**
 * A freeze-corn projectile thrown by the player in BossScene.
 * Steps tile-by-tile in the given direction until it hits a wall, the grid
 * edge, or the caller's onHit callback signals a stop.
 */
export class Projectile extends Phaser.GameObjects.Image {
  private dRow: number;
  private dCol: number;
  private curRow: number;
  private curCol: number;
  private offsetX: number;
  private offsetY: number;
  private tileSize: number;
  private grid: number[][];
  private onHit: (row: number, col: number) => boolean; // return true to stop
  private stopped: boolean = false;

  constructor(
    scene: Phaser.Scene,
    startRow: number,
    startCol: number,
    dRow: number,
    dCol: number,
    offsetX: number,
    offsetY: number,
    tileSize: number,
    grid: number[][],
    onHit: (row: number, col: number) => boolean
  ) {
    const x = offsetX + startCol * tileSize + tileSize / 2;
    const y = offsetY + startRow * tileSize + tileSize / 2;
    super(scene, x, y, "kernel");

    this.dRow = dRow;
    this.dCol = dCol;
    this.curRow = startRow;
    this.curCol = startCol;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.tileSize = tileSize;
    this.grid = grid;
    this.onHit = onHit;

    // Scale up a bit so it's clearly visible as a projectile
    this.setScale(3).setDepth(120).setAlpha(0.9);
    // Tint it ice-blue
    this.setTint(0x00ddff);

    scene.add.existing(this);
  }

  launch() {
    this.step();
  }

  private step() {
    if (this.stopped) return;

    const nextRow = this.curRow + this.dRow;
    const nextCol = this.curCol + this.dCol;
    const gridSize = this.grid.length;

    // Out of bounds or wall — projectile stops
    if (
      nextRow < 0 || nextRow >= gridSize ||
      nextCol < 0 || nextCol >= gridSize ||
      this.grid[nextRow][nextCol] === TILE.WALL
    ) {
      this.destroy();
      return;
    }

    this.curRow = nextRow;
    this.curCol = nextCol;

    const targetX = this.offsetX + nextCol * this.tileSize + this.tileSize / 2;
    const targetY = this.offsetY + nextRow * this.tileSize + this.tileSize / 2;

    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: 55,
      ease: "Linear",
      onComplete: () => {
        if (this.stopped) return;
        const hit = this.onHit(this.curRow, this.curCol);
        if (hit) {
          this.stopped = true;
          // Brief flash on hit tile, then destroy
          this.scene.time.delayedCall(80, () => this.destroy());
        } else {
          this.step();
        }
      },
    });
  }
}
