import Phaser from "phaser";
import { TILE } from "../utils/constants";

type KeithState = "patrol" | "charging" | "hurt" | "dead";

interface KeithPhaseConfig {
  patrolSpeed: number;
  stompInterval: number | null; // null = no stomps in this phase
  chargeEnabled: boolean;
}

const PHASE_CONFIGS: Record<number, KeithPhaseConfig> = {
  3: { patrolSpeed: 700, stompInterval: null, chargeEnabled: false },
  2: { patrolSpeed: 450, stompInterval: 3500, chargeEnabled: true },
  1: { patrolSpeed: 280, stompInterval: 2000, chargeEnabled: true },
};

export class BigKeith extends Phaser.GameObjects.Image {
  gridRow: number;
  gridCol: number;
  hp: number = 3;

  private keithState: KeithState = "patrol";
  private grid: number[][];
  private offsetX: number;
  private offsetY: number;
  private tileSize: number;
  private moveTimer?: Phaser.Time.TimerEvent;
  private stompTimer?: Phaser.Time.TimerEvent;
  private frozen: boolean = false;

  // BFS patrol: ping-pong between a fixed set of waypoints
  private patrolPoints: [number, number][];
  private patrolIndex: number = 0;
  private patrolDir: 1 | -1 = 1;

  constructor(
    scene: Phaser.Scene,
    startRow: number,
    startCol: number,
    patrolPoints: [number, number][],
    offsetX: number,
    offsetY: number,
    tileSize: number,
    grid: number[][]
  ) {
    const x = offsetX + startCol * tileSize + tileSize / 2;
    const y = offsetY + startRow * tileSize + tileSize / 2;
    super(scene, x, y, "enemy");

    this.gridRow = startRow;
    this.gridCol = startCol;
    this.patrolPoints = patrolPoints;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.tileSize = tileSize;
    this.grid = grid;

    // Big Keith is 1.4× the size of normal enemies
    const scale = (tileSize * 0.9) / this.width;
    this.setScale(scale);
    // Slightly red tint to signal danger
    this.setTint(0xff8866);
    this.setDepth(50);

    scene.add.existing(this);

    // Idle pulse — more menacing than regular enemies
    scene.tweens.add({
      targets: this,
      scaleX: scale * 1.08,
      scaleY: scale * 1.08,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.startPhase(3);
  }

  // --- Public API ---

  takeDamage() {
    if (this.keithState === "hurt" || this.keithState === "dead") return;
    this.hp = Math.max(0, this.hp - 1);
    this.keithState = "hurt";

    this.stopTimers();

    // White flash
    this.setTint(0xffffff);
    this.scene.time.delayedCall(400, () => {
      if (this.hp <= 0) {
        this.keithState = "dead";
        this.emit("dead");
        return;
      }
      this.clearTint();
      this.keithState = "patrol";
      this.startPhase(this.hp);
    });

    this.emit("damaged", this.hp);
  }

  freeze(ms: number) {
    if (this.frozen) return;
    this.frozen = true;
    if (this.moveTimer) this.moveTimer.paused = true;
    if (this.stompTimer) this.stompTimer.paused = true;
    this.setTint(0x00aaff);
    this.scene.time.delayedCall(ms, () => {
      this.frozen = false;
      if (this.keithState !== "dead") {
        if (this.moveTimer) this.moveTimer.paused = false;
        if (this.stompTimer) this.stompTimer.paused = false;
        this.clearTint();
        // Restore phase tint
        if (this.hp === 2) this.setTint(0xff6644);
        if (this.hp === 1) this.setTint(0xff2200);
      }
    });
  }

  stopAll() {
    this.stopTimers();
  }

  // --- Private ---

  private startPhase(hp: number) {
    const config = PHASE_CONFIGS[hp] ?? PHASE_CONFIGS[1];

    // Update tint per phase severity
    if (hp === 3) this.setTint(0xff8866);
    if (hp === 2) this.setTint(0xff6644);
    if (hp === 1) this.setTint(0xff2200);

    // Move timer
    this.moveTimer = this.scene.time.addEvent({
      delay: config.patrolSpeed,
      callback: this.moveNext,
      callbackScope: this,
      loop: true,
    });

    // Stomp timer
    if (config.stompInterval !== null) {
      this.stompTimer = this.scene.time.addEvent({
        delay: config.stompInterval,
        callback: this.initiateStormp,
        callbackScope: this,
        loop: true,
      });
    }

    // Charge — triggered periodically via move timer count
    this.scene.time.addEvent({
      delay: config.chargeEnabled ? 5000 : 999999,
      callback: this.initiateCharge,
      callbackScope: this,
      loop: true,
    });
  }

  private stopTimers() {
    this.moveTimer?.remove(false);
    this.stompTimer?.remove(false);
    this.moveTimer = undefined;
    this.stompTimer = undefined;
  }

  private moveNext() {
    if (this.frozen || this.keithState !== "patrol") return;

    const nextIndex = this.patrolIndex + this.patrolDir;
    if (nextIndex < 0 || nextIndex >= this.patrolPoints.length) {
      this.patrolDir = (this.patrolDir * -1) as 1 | -1;
    }
    this.patrolIndex = Math.max(0, Math.min(this.patrolPoints.length - 1, this.patrolIndex + this.patrolDir));

    const [newRow, newCol] = this.patrolPoints[this.patrolIndex];
    this.tweenTo(newRow, newCol);
  }

  private initiateStormp() {
    if (this.frozen || this.keithState !== "patrol") return;

    // Collect surrounding tiles
    const tiles: [number, number][] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = this.gridRow + dr;
        const c = this.gridCol + dc;
        if (r >= 0 && r < this.grid.length && c >= 0 && c < this.grid[0].length) {
          tiles.push([r, c]);
        }
      }
    }

    this.emit("stomp", tiles);
  }

  private initiateCharge() {
    if (this.frozen || this.keithState !== "patrol") return;
    this.keithState = "charging";

    // Emit telegraph — BossScene will pick direction based on player position
    this.emit("chargeTelegraph");

    // After 1.5s, actually execute the charge
    this.scene.time.delayedCall(1500, () => {
      if (this.keithState !== "charging") return;
      this.emit("chargeExecute");
      this.keithState = "patrol";
    });
  }

  tweenTo(newRow: number, newCol: number) {
    this.gridRow = newRow;
    this.gridCol = newCol;

    const targetX = this.offsetX + newCol * this.tileSize + this.tileSize / 2;
    const targetY = this.offsetY + newRow * this.tileSize + this.tileSize / 2;

    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: 130,
      ease: "Power2",
      onComplete: () => this.emit("moved"),
    });
  }

  // BFS for charge direction finding
  getRowFloorTiles(row: number): [number, number][] {
    const tiles: [number, number][] = [];
    for (let c = 0; c < this.grid[0].length; c++) {
      if (this.grid[row][c] !== TILE.WALL) tiles.push([row, c]);
    }
    return tiles;
  }

  getColFloorTiles(col: number): [number, number][] {
    const tiles: [number, number][] = [];
    for (let r = 0; r < this.grid.length; r++) {
      if (this.grid[r][col] !== TILE.WALL) tiles.push([r, col]);
    }
    return tiles;
  }
}
