import Phaser from "phaser";
import { EnemySpawn } from "../data/levels";

export class Enemy extends Phaser.GameObjects.Image {
  gridRow: number;
  gridCol: number;
  private patrol: [number, number][];
  private patrolIndex: number;
  private patrolDirection: 1 | -1 = 1;
  private offsetX: number;
  private offsetY: number;
  private tileSize: number;
  private moveTimer?: Phaser.Time.TimerEvent;

  constructor(
    scene: Phaser.Scene,
    spawn: EnemySpawn,
    offsetX: number,
    offsetY: number,
    tileSize: number
  ) {
    const [startRow, startCol] = spawn.start;
    const x = offsetX + startCol * tileSize + tileSize / 2;
    const y = offsetY + startRow * tileSize + tileSize / 2;
    super(scene, x, y, "enemy");

    this.gridRow = startRow;
    this.gridCol = startCol;
    this.patrol = spawn.patrol;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.tileSize = tileSize;

    // Find the starting index in the patrol array
    this.patrolIndex = this.patrol.findIndex(
      ([r, c]) => r === startRow && c === startCol
    );
    if (this.patrolIndex === -1) this.patrolIndex = 0;

    const scale = (tileSize * 0.65) / this.width;
    this.setScale(scale);
    this.setDepth(20);

    scene.add.existing(this);

    // Idle pulse animation
    scene.tweens.add({
      targets: this,
      scaleX: scale * 1.12,
      scaleY: scale * 1.12,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.startPatrol(spawn.speed);
  }

  startPatrol(speed: number) {
    this.moveTimer = this.scene.time.addEvent({
      delay: speed,
      callback: this.moveNext,
      callbackScope: this,
      loop: true,
    });
  }

  stopPatrol() {
    if (this.moveTimer) {
      this.moveTimer.remove(false);
      this.moveTimer = undefined;
    }
  }

  private moveNext() {
    // Advance index in current direction
    const nextIndex = this.patrolIndex + this.patrolDirection;

    // Reverse at ends
    if (nextIndex < 0 || nextIndex >= this.patrol.length) {
      this.patrolDirection = (this.patrolDirection * -1) as 1 | -1;
    }

    this.patrolIndex += this.patrolDirection;
    const [newRow, newCol] = this.patrol[this.patrolIndex];

    // Update logical position immediately (needed for next patrol step calc)
    this.gridRow = newRow;
    this.gridCol = newCol;

    const targetX = this.offsetX + newCol * this.tileSize + this.tileSize / 2;
    const targetY = this.offsetY + newRow * this.tileSize + this.tileSize / 2;

    // Emit "moved" only after the tween finishes so collision fires when
    // the enemy is visually on the tile — prevents "killed from a distance" feel
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: 150,
      ease: "Power2",
      onComplete: () => {
        this.emit("moved");
      },
    });
  }
}
