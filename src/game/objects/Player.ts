import Phaser from "phaser";
import { TILE } from "../utils/constants";

export class Player extends Phaser.GameObjects.Image {
  gridRow: number;
  gridCol: number;
  private isMoving: boolean = false;
  private offsetX: number;
  private offsetY: number;
  private levelGrid: number[][];
  private tileSize: number;

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

    // Scale sprite to fit tile
    const spriteScale = (tileSize * 0.7) / this.width;
    this.setScale(spriteScale);

    scene.add.existing(this);
  }

  tryMove(dRow: number, dCol: number): boolean {
    if (this.isMoving) return false;

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
    this.gridRow = newRow;
    this.gridCol = newCol;

    this.emit("moved");

    const targetX = this.offsetX + newCol * this.tileSize + this.tileSize / 2;
    const targetY = this.offsetY + newRow * this.tileSize + this.tileSize / 2;

    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: 80,
      ease: "Power2",
      onComplete: () => {
        this.isMoving = false;
      },
    });

    return true;
  }
}
