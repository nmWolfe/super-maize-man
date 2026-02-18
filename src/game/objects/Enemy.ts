import Phaser from "phaser";
import { TILE } from "../utils/constants";
import { EnemySpawn } from "../data/levels";

type EnemyState = "patrol" | "chase";

export class Enemy extends Phaser.GameObjects.Image {
  gridRow: number;
  gridCol: number;
  private patrol: [number, number][];
  private patrolIndex: number;
  private patrolDirection: 1 | -1 = 1;
  private patrolSpeed: number;
  private offsetX: number;
  private offsetY: number;
  private tileSize: number;
  private moveTimer?: Phaser.Time.TimerEvent;
  private grid: number[][];

  // AI state machine
  private aiState: EnemyState = "patrol";
  private chaseTarget: [number, number] = [0, 0];
  private chaseStepCount: number = 0;
  private readonly CHASE_GIVEUP_STEPS = 10;
  private frozen: boolean = false;

  constructor(
    scene: Phaser.Scene,
    spawn: EnemySpawn,
    offsetX: number,
    offsetY: number,
    tileSize: number,
    grid: number[][]
  ) {
    const [startRow, startCol] = spawn.start;
    const x = offsetX + startCol * tileSize + tileSize / 2;
    const y = offsetY + startRow * tileSize + tileSize / 2;
    super(scene, x, y, "enemy");

    this.gridRow = startRow;
    this.gridCol = startCol;
    this.patrol = spawn.patrol;
    this.patrolSpeed = spawn.speed;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.tileSize = tileSize;
    this.grid = grid;

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
    this.stopPatrol();
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

  // --- Power-up: Freeze ---
  freeze(duration: number) {
    if (this.frozen) return;
    this.frozen = true;
    if (this.moveTimer) this.moveTimer.paused = true;
    this.setTint(0x00aaff);
    this.scene.time.delayedCall(duration, () => {
      this.frozen = false;
      if (this.moveTimer) this.moveTimer.paused = false;
      this.clearTint();
    });
  }

  // --- Phase C: Line-of-sight detection ---
  checkLineOfSight(playerRow: number, playerCol: number) {
    if (this.frozen) return;

    if (this.aiState === "chase") {
      // Keep target updated while chasing
      this.chaseTarget = [playerRow, playerCol];
      return;
    }

    const sameRow = playerRow === this.gridRow;
    const sameCol = playerCol === this.gridCol;

    if (sameRow || sameCol) {
      if (this.clearSightBetween(this.gridRow, this.gridCol, playerRow, playerCol)) {
        this.enterChase(playerRow, playerCol);
      }
    }
  }

  private clearSightBetween(r1: number, c1: number, r2: number, c2: number): boolean {
    // Walk from (r1,c1) toward (r2,c2) tile by tile; return false if any wall blocks
    const dr = Math.sign(r2 - r1);
    const dc = Math.sign(c2 - c1);
    let r = r1 + dr;
    let c = c1 + dc;
    const maxSteps = 6; // vision cap
    let steps = 0;
    while ((r !== r2 || c !== c2) && steps < maxSteps) {
      if (this.grid[r]?.[c] === TILE.WALL) return false;
      r += dr;
      c += dc;
      steps++;
    }
    return steps < maxSteps;
  }

  private enterChase(targetRow: number, targetCol: number) {
    this.aiState = "chase";
    this.chaseTarget = [targetRow, targetCol];
    this.chaseStepCount = 0;
    // Speed up during chase
    this.startPatrol(280);
    // Brief red flash
    this.setTint(0xff2020);
    this.scene.time.delayedCall(300, () => this.clearTint());
    this.emit("alert"); // GameScene can play the alarm sound
  }

  private exitChase() {
    this.aiState = "patrol";
    this.chaseStepCount = 0;
    this.startPatrol(this.patrolSpeed);
  }

  // --- BFS pathfinding (small grid, very fast) ---
  private bfsNextStep(toRow: number, toCol: number): [number, number] | null {
    const start: [number, number] = [this.gridRow, this.gridCol];
    if (start[0] === toRow && start[1] === toCol) return null;

    const rows = this.grid.length;
    const cols = this.grid[0].length;
    const visited = Array.from({ length: rows }, () => new Array(cols).fill(false));
    const prev = Array.from({ length: rows }, () =>
      new Array(cols).fill(null) as ([number, number] | null)[]
    );

    const queue: [number, number][] = [start];
    visited[start[0]][start[1]] = true;

    const dirs: [number, number][] = [[-1,0],[1,0],[0,-1],[0,1]];

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      if (r === toRow && c === toCol) {
        // Trace back to find first step
        let cur: [number, number] = [r, c];
        while (prev[cur[0]][cur[1]] !== null) {
          const p = prev[cur[0]][cur[1]]!;
          if (p[0] === start[0] && p[1] === start[1]) return cur;
          cur = p;
        }
        return null;
      }
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
            !visited[nr][nc] && this.grid[nr][nc] !== TILE.WALL) {
          visited[nr][nc] = true;
          prev[nr][nc] = [r, c];
          queue.push([nr, nc]);
        }
      }
    }
    return null; // no path
  }

  private moveNext() {
    if (this.frozen) return;

    if (this.aiState === "chase") {
      this.chaseStepCount++;
      if (this.chaseStepCount >= this.CHASE_GIVEUP_STEPS) {
        this.exitChase();
        return;
      }
      const next = this.bfsNextStep(this.chaseTarget[0], this.chaseTarget[1]);
      if (next) {
        this.tweenTo(next[0], next[1]);
      } else {
        this.exitChase();
      }
      return;
    }

    // Patrol logic
    const nextIndex = this.patrolIndex + this.patrolDirection;
    if (nextIndex < 0 || nextIndex >= this.patrol.length) {
      this.patrolDirection = (this.patrolDirection * -1) as 1 | -1;
    }
    this.patrolIndex += this.patrolDirection;
    const [newRow, newCol] = this.patrol[this.patrolIndex];
    this.tweenTo(newRow, newCol);
  }

  private tweenTo(newRow: number, newCol: number) {
    this.gridRow = newRow;
    this.gridCol = newCol;

    const targetX = this.offsetX + newCol * this.tileSize + this.tileSize / 2;
    const targetY = this.offsetY + newRow * this.tileSize + this.tileSize / 2;

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
