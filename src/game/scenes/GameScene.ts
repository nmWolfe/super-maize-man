import Phaser from "phaser";
import { TILE, TILE_SIZE, SCENES } from "../utils/constants";
import { levels } from "../data/levels";
import { Player } from "../objects/Player";
import { Corn } from "../objects/Corn";
import { DPad } from "../ui/DPad";
import { SoundManager } from "../audio/SoundManager";
import { Enemy } from "../objects/Enemy";
import { FogOfWar } from "../ui/FogOfWar";

const MOVE_REPEAT_DELAY = 120; // ms between moves when holding a key

export class GameScene extends Phaser.Scene {
  private levelIndex: number = 0;
  private totalCorn: number = 0;
  private player!: Player;
  private corns: Corn[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private gridOffsetX: number = 0;
  private gridOffsetY: number = 0;
  private dpad!: DPad;
  private timeLeft: number = 0;
  private timerEvent!: Phaser.Time.TimerEvent;
  private timeDisplay!: HTMLInputElement;
  private cornDisplay!: HTMLInputElement;
  private lastMoveTime: number = 0;
  private effectiveTileSize: number = 0;
  private soundManager!: SoundManager;
  private enemies: Enemy[] = [];
  private fog?: FogOfWar;

  constructor() {
    super(SCENES.GAME);
  }

  init(data: { levelIndex: number; totalCorn: number }) {
    this.levelIndex = data.levelIndex ?? 0;
    this.totalCorn = data.totalCorn ?? 0;
    this.corns = [];
    this.enemies = [];
    this.lastMoveTime = 0;
  }

  create() {
    const level = levels[this.levelIndex];
    const gridSize = level.grid.length;
    this.timeLeft = level.timeLimit;

    this.soundManager = new SoundManager();

    // Get DOM counter references
    this.timeDisplay = document.querySelector(".time-counter") as HTMLInputElement;
    this.cornDisplay = document.querySelector(".corn-counter") as HTMLInputElement;
    this.updateHUD();

    // Calculate tile size to fill the canvas with some padding
    const canvasW = this.scale.width;
    const canvasH = this.scale.height;
    const padding = 16;
    const availableSize = Math.min(canvasW, canvasH) - padding * 2;
    this.effectiveTileSize = Math.floor(availableSize / gridSize);

    const gridPixelSize = gridSize * this.effectiveTileSize;
    this.gridOffsetX = (canvasW - gridPixelSize) / 2;
    this.gridOffsetY = (canvasH - gridPixelSize) / 2;

    // Render the grid
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const tileType = level.grid[row][col];
        const x = this.gridOffsetX + col * this.effectiveTileSize + this.effectiveTileSize / 2;
        const y = this.gridOffsetY + row * this.effectiveTileSize + this.effectiveTileSize / 2;

        // Floor tile — scale from base TILE_SIZE to effective size
        const floor = this.add.image(x, y, "floor-tile");
        floor.setScale(this.effectiveTileSize / TILE_SIZE).setDepth(0);

        if (tileType === TILE.WALL) {
          const wall = this.add.image(x, y, "wall-tile");
          wall.setScale(this.effectiveTileSize / TILE_SIZE).setDepth(0);
        } else if (tileType === TILE.CORN) {
          const corn = new Corn(this, row, col, this.gridOffsetX, this.gridOffsetY, this.effectiveTileSize);
          corn.setDepth(10);
          this.corns.push(corn);
        }
      }
    }

    // Place player at start position
    const [startRow, startCol] = level.playerStart;
    this.player = new Player(
      this,
      startRow,
      startCol,
      this.gridOffsetX,
      this.gridOffsetY,
      level.grid,
      this.effectiveTileSize
    );

    // Idle animations
    this.corns.forEach((corn, i) => {
      this.tweens.add({
        targets: corn,
        y: corn.y - 3,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: i * 100,
      });
    });

    this.tweens.add({
      targets: this.player,
      scaleX: this.player.scaleX * 1.05,
      scaleY: this.player.scaleY * 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Spawn enemies if the level defines them (depth 20, sits below fog at 100)
    if (level.enemies) {
      for (const spawn of level.enemies) {
        const enemy = new Enemy(this, spawn, this.gridOffsetX, this.gridOffsetY, this.effectiveTileSize);
        this.enemies.push(enemy);
        enemy.on("moved", () => this.checkEnemyCollision());
      }
    }

    // Set player above fog (depth 101)
    this.player.setDepth(101);

    // Fog of war overlay (depth 100 — covers corn, enemies, walls)
    if (level.fogOfWar?.enabled) {
      this.fog = new FogOfWar(
        this,
        gridSize,
        this.gridOffsetX,
        this.gridOffsetY,
        this.effectiveTileSize,
        level.fogOfWar.revealRadius
      );
      this.fog.update(this.player.gridRow, this.player.gridCol);
    }

    // Listen for player movement to check corn collection, enemy collision, and proximity
    this.player.on("moved", () => {
      this.checkCornCollection();
      this.checkEnemyCollision();
      this.fog?.update(this.player.gridRow, this.player.gridCol);
      this.checkEnemyProximity();
    });

    // Cleanup on scene shutdown
    this.events.on("shutdown", () => {
      this.enemies.forEach(e => e.stopPatrol());
      this.fog?.destroy();
      this.fog = undefined;
    });

    // Keyboard input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }

    // D-pad (touch controls) — hidden on desktop
    this.dpad = new DPad(this, (dir) => {
      switch (dir) {
        case "up": this.player.tryMove(-1, 0); break;
        case "down": this.player.tryMove(1, 0); break;
        case "left": this.player.tryMove(0, -1); break;
        case "right": this.player.tryMove(0, 1); break;
      }
    });

    // Hide d-pad on desktop (>1200px, matching original behavior)
    if (window.innerWidth > 1200) {
      this.dpad.setVisible(false);
    }

    // Timer
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: level.timeLimit - 1,
      callback: () => {
        this.timeLeft--;
        this.updateHUD();
        if (this.timeLeft <= 0) {
          this.handleTimeout();
        } else if (this.timeLeft <= 5) {
          this.soundManager.timerWarning();
        }
      },
    });
  }

  private tryMoveWithCooldown(dRow: number, dCol: number) {
    const now = this.time.now;
    if (now - this.lastMoveTime >= MOVE_REPEAT_DELAY) {
      if (this.player.tryMove(dRow, dCol)) {
        this.lastMoveTime = now;
        this.soundManager.playerStep();
      }
    }
  }

  private checkCornCollection() {
    const level = levels[this.levelIndex];

    for (let i = this.corns.length - 1; i >= 0; i--) {
      const corn = this.corns[i];
      if (corn.gridRow === this.player.gridRow && corn.gridCol === this.player.gridCol) {
        corn.collect();
        this.corns.splice(i, 1);
        this.totalCorn++;
        this.soundManager.cornPickup();
        this.updateHUD();

        if (this.totalCorn >= level.cornToAdvance) {
          this.timerEvent.remove();
          if (this.levelIndex < levels.length - 1) {
            this.advanceLevel();
          } else {
            this.handleWin();
          }
        }
        break;
      }
    }
  }

  private checkEnemyProximity() {
    if (this.enemies.length === 0) return;
    const minDist = this.enemies.reduce((best, enemy) => {
      const d = Math.max(
        Math.abs(enemy.gridRow - this.player.gridRow),
        Math.abs(enemy.gridCol - this.player.gridCol)
      );
      return Math.min(best, d);
    }, Infinity);
    if (minDist <= 2) {
      this.soundManager.enemyNearby();
    }
  }

  private checkEnemyCollision() {
    for (const enemy of this.enemies) {
      if (enemy.gridRow === this.player.gridRow && enemy.gridCol === this.player.gridCol) {
        this.handleEnemyCaught();
        return;
      }
    }
  }

  private handleEnemyCaught() {
    this.timerEvent.remove();
    this.enemies.forEach(e => e.stopPatrol());
    this.soundManager.gameOverLose();
    this.time.delayedCall(350, () => {
      this.scene.start(SCENES.GAME_OVER, { won: false });
    });
  }

  private advanceLevel() {
    this.soundManager.levelComplete();
    this.time.delayedCall(300, () => {
      this.scene.start(SCENES.LEVEL_COMPLETE, {
        nextLevelIndex: this.levelIndex + 1,
        totalCorn: this.totalCorn,
      });
    });
  }

  private handleTimeout() {
    this.soundManager.gameOverLose();
    this.scene.start(SCENES.GAME_OVER, { won: false });
  }

  private handleWin() {
    this.soundManager.gameOverWin();
    this.time.delayedCall(300, () => {
      this.scene.start(SCENES.GAME_OVER, { won: true });
    });
  }

  private updateHUD() {
    if (this.timeDisplay) {
      this.timeDisplay.value = `00: ${String(this.timeLeft).padStart(2, "0")}`;
    }
    if (this.cornDisplay) {
      this.cornDisplay.value = `${this.totalCorn} :`;
    }
  }

  update() {
    if (!this.cursors) return;

    // Held-key movement with cooldown for continuous traversal
    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      this.tryMoveWithCooldown(-1, 0);
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      this.tryMoveWithCooldown(1, 0);
    } else if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.tryMoveWithCooldown(0, -1);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.tryMoveWithCooldown(0, 1);
    }
  }
}
