import Phaser from "phaser";
import { TILE } from "../utils/constants";

export class Corn extends Phaser.GameObjects.Image {
  gridRow: number;
  gridCol: number;
  tileType: number;

  constructor(
    scene: Phaser.Scene,
    gridRow: number,
    gridCol: number,
    offsetX: number,
    offsetY: number,
    tileSize: number,
    tileType: number = TILE.CORN
  ) {
    const x = offsetX + gridCol * tileSize + tileSize / 2;
    const y = offsetY + gridRow * tileSize + tileSize / 2;
    const textureKey = tileType === TILE.CORN ? "corn" : `powerup-${tileType}`;
    super(scene, x, y, textureKey);

    this.gridRow = gridRow;
    this.gridCol = gridCol;
    this.tileType = tileType;

    const spriteScale = (tileSize * 0.7) / this.width;
    this.setScale(spriteScale);

    scene.add.existing(this);
  }

  collect() {
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 200,
      ease: "Power2",
      onComplete: () => {
        this.destroy();
      },
    });
  }
}
