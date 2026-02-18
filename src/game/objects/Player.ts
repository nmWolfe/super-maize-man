import Phaser from "phaser";
import { TILE } from "../utils/constants";

export class Player extends Phaser.GameObjects.Image {
  gridRow: number;
  gridCol: number;
  private isMoving: boolean = false;
  private offsetX: number;
  private offsetY: number;
  private levelGrid: number[][];
  tileSize: number;

  // Power-up state (public so GameScene can set them)
  isConfused: boolean = false;
  isSlideLocked: boolean = false;
  speedMultiplier: number = 1; // 0.5 = 2× speed (halves tween duration)

  // Boss fight state
  lastDRow: number = 0;
  lastDCol: number = 0;
  hasFreezeCorn: boolean = false;

  constructor(
    scene: Phaser.Scene,
    gridRow: number,
    gridCol: number,
    offsetX: number,
    offsetY: number,
    levelGrid: number[][],
    tileSize: number
  ) {
    const x = offsetX + gridCol * tileSize + tileSize / 2;
    const y = offsetY + gridRow * tileSize + tileSize / 2;
    super(scene, x, y, "player");

    this.gridRow = gridRow;
    this.gridCol = gridCol;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.levelGrid = levelGrid;
    this.tileSize = tileSize;

    const spriteScale = (tileSize * 0.7) / this.width;
    this.setScale(spriteScale);

    scene.add.existing(this);
  }

  tryMove(dRow: number, dCol: number): boolean {
    if (this.isMoving || this.isSlideLocked) return false;

    const newRow = this.gridRow + dRow;
    const newCol = this.gridCol + dCol;
    const gridSize = this.levelGrid.length;

    if (newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize) {
      return false;
    }

    if (this.levelGrid[newRow][newCol] === TILE.WALL) {
      return false;
    }

    this.isMoving = true;
    this.lastDRow = dRow;
    this.lastDCol = dCol;
    this.gridRow = newRow;
    this.gridCol = newCol;

    this.emit("moved");

    const targetX = this.offsetX + newCol * this.tileSize + this.tileSize / 2;
    const targetY = this.offsetY + newRow * this.tileSize + this.tileSize / 2;

    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: Math.round(80 * this.speedMultiplier),
      ease: "Power2",
      onComplete: () => {
        this.isMoving = false;
      },
    });

    return true;
  }

  // Used by ice slide to snap between tiles during the tween sequence
  snapToGrid(row: number, col: number) {
    this.gridRow = row;
    this.gridCol = col;
    this.x = this.offsetX + col * this.tileSize + this.tileSize / 2;
    this.y = this.offsetY + row * this.tileSize + this.tileSize / 2;
  }

  get offsetXVal() { return this.offsetX; }
  get offsetYVal() { return this.offsetY; }
  get grid() { return this.levelGrid; }
}
