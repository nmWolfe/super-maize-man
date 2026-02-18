import Phaser from "phaser";
import { TILE, TILE_SIZE, SCENES } from "../utils/constants";
import { levels, LevelData } from "../data/levels";
import { generateLevel } from "../data/MazeGenerator";
import { Player } from "../objects/Player";
import { Corn } from "../objects/Corn";
import { DPad } from "../ui/DPad";
import { SoundManager } from "../audio/SoundManager";
import { Enemy } from "../objects/Enemy";
import { FogOfWar } from "../ui/FogOfWar";

const MOVE_REPEAT_DELAY = 120;

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
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;

  // Endless mode support
  private proceduralLevel: LevelData | null = null;
  private runLevel: number = 1;
  private seed: number = 0;

  constructor() {
    super(SCENES.GAME);
  }

  init(data: {
    levelIndex?: number; totalCorn?: number;
    proceduralLevel?: LevelData; runLevel?: number; seed?: number;
  }) {
    this.levelIndex = data.levelIndex ?? 0;
    this.totalCorn = data.totalCorn ?? 0;
    this.runLevel = data.runLevel ?? 1;
    this.seed = data.seed ?? 0;
    // If re-entering endless mode with seed+runLevel but no pre-built level, generate now
    if (data.proceduralLevel) {
      this.proceduralLevel = data.proceduralLevel;
    } else if (this.seed > 0) {
      this.proceduralLevel = generateLevel(this.seed, this.runLevel);
    } else {
      this.proceduralLevel = null;
    }
    this.corns = [];
    this.enemies = [];
    this.lastMoveTime = 0;
  }

  create() {
    const level = this.proceduralLevel ?? levels[this.levelIndex];
    const gridSize = level.grid.length;
    this.timeLeft = level.timeLimit;

    this.soundManager = new SoundManager();

    // Corn burst particle emitter
    this.particles = this.add.particles(0, 0, "kernel", {
      speed: { min: 60, max: 160 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      quantity: 10,
      emitting: false,
    }).setDepth(110);

    // DOM HUD
    this.timeDisplay = document.querySelector(".time-counter") as HTMLInputElement;
    this.cornDisplay = document.querySelector(".corn-counter") as HTMLInputElement;
    this.updateHUD();

    // Dynamic tile sizing
    const canvasW = this.scale.width;
    const canvasH = this.scale.height;
    const padding = 16;
    const availableSize = Math.min(canvasW, canvasH) - padding * 2;
    this.effectiveTileSize = Math.floor(availableSize / gridSize);

    const gridPixelSize = gridSize * this.effectiveTileSize;
    this.gridOffsetX = (canvasW - gridPixelSize) / 2;
    this.gridOffsetY = (canvasH - gridPixelSize) / 2;

    // Render grid — power-up tiles are Corn objects with a tileType
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const tileType = level.grid[row][col];
        const x = this.gridOffsetX + col * this.effectiveTileSize + this.effectiveTileSize / 2;
        const y = this.gridOffsetY + row * this.effectiveTileSize + this.effectiveTileSize / 2;

        const floor = this.add.image(x, y, "floor-tile");
        floor.setScale(this.effectiveTileSize / TILE_SIZE).setDepth(0);

        if (tileType === TILE.WALL) {
          const wall = this.add.image(x, y, "wall-tile");
          wall.setScale(this.effectiveTileSize / TILE_SIZE).setDepth(0);
        } else if (tileType === TILE.CORN ||
          tileType === TILE.CORN_FREEZE || tileType === TILE.CORN_SPEED ||
          tileType === TILE.CORN_ICE   || tileType === TILE.CORN_CONFUSION) {
          const corn = new Corn(this, row, col, this.gridOffsetX, this.gridOffsetY, this.effectiveTileSize, tileType);
          corn.setDepth(10);
          this.corns.push(corn);
        }
      }
    }

    // Player
    const [startRow, startCol] = level.playerStart;
    this.player = new Player(this, startRow, startCol, this.gridOffsetX, this.gridOffsetY, level.grid, this.effectiveTileSize);

    // Idle animations
    this.corns.forEach((corn, i) => {
      this.tweens.add({ targets: corn, y: corn.y - 3, duration: 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut", delay: i * 100 });
    });
    this.tweens.add({
      targets: this.player,
      scaleX: this.player.scaleX * 1.05, scaleY: this.player.scaleY * 1.05,
      duration: 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });

    // Enemies — pass grid reference for LoS / BFS
    if (level.enemies) {
      for (const spawn of level.enemies) {
        const enemy = new Enemy(this, spawn, this.gridOffsetX, this.gridOffsetY, this.effectiveTileSize, level.grid);
        this.enemies.push(enemy);
        enemy.on("moved", () => this.checkEnemyCollision());
        enemy.on("alert", () => this.soundManager.farmerAlert());
      }
    }

    // Depth + fog
    this.player.setDepth(101);
    if (level.fogOfWar?.enabled) {
      this.fog = new FogOfWar(this, gridSize, this.gridOffsetX, this.gridOffsetY, this.effectiveTileSize, level.fogOfWar.revealRadius);
      this.fog.update(this.player.gridRow, this.player.gridCol);
    }

    // Player movement events
    this.player.on("moved", () => {
      this.checkCornCollection();
      this.checkEnemyCollision();
      this.fog?.update(this.player.gridRow, this.player.gridCol);
      this.checkEnemyProximity();
      this.enemies.forEach(e => e.checkLineOfSight(this.player.gridRow, this.player.gridCol));
    });

    // Cleanup
    this.events.on("shutdown", () => {
      this.enemies.forEach(e => e.stopPatrol());
      this.fog?.destroy();
      this.fog = undefined;
    });

    // Keyboard
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }

    // D-pad
    this.dpad = new DPad(this, (dir) => {
      switch (dir) {
        case "up":    this.player.tryMove(-1, 0); break;
        case "down":  this.player.tryMove(1, 0);  break;
        case "left":  this.player.tryMove(0, -1); break;
        case "right": this.player.tryMove(0, 1);  break;
      }
    });
    if (window.innerWidth > 1200) this.dpad.setVisible(false);

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
    if (this.player.isSlideLocked) return;
    const now = this.time.now;
    if (now - this.lastMoveTime >= MOVE_REPEAT_DELAY) {
      // Flip direction if confused
      const r = this.player.isConfused ? -dRow : dRow;
      const c = this.player.isConfused ? -dCol : dCol;
      if (this.player.tryMove(r, c)) {
        this.lastMoveTime = now;
        this.soundManager.playerStep();
      }
    }
  }

  private checkCornCollection() {
    const level = this.proceduralLevel ?? levels[this.levelIndex];

    for (let i = this.corns.length - 1; i >= 0; i--) {
      const corn = this.corns[i];
      if (corn.gridRow === this.player.gridRow && corn.gridCol === this.player.gridCol) {
        this.particles.emitParticleAt(corn.x, corn.y, 10);
        const tileType = corn.tileType;
        corn.collect();
        this.corns.splice(i, 1);

        if (tileType === TILE.CORN) {
          this.totalCorn++;
          this.soundManager.cornPickup();
        } else {
          // Power-up corn also counts toward advance total
          this.totalCorn++;
          this.applyPowerUp(tileType);
        }

        this.updateHUD();

        if (this.totalCorn >= level.cornToAdvance) {
          this.timerEvent.remove();
          if (this.proceduralLevel) {
            this.advanceEndlessLevel();
          } else if (this.levelIndex < levels.length - 1) {
            this.advanceLevel();
          } else {
            this.handleWin();
          }
        }
        break;
      }
    }
  }

  private applyPowerUp(type: number) {
    switch (type) {
      case TILE.CORN_FREEZE:
        this.enemies.forEach(e => e.freeze(3000));
        this.soundManager.powerUpFreeze();
        break;

      case TILE.CORN_SPEED:
        this.player.speedMultiplier = 0.5;
        this.soundManager.powerUpSpeed();
        this.time.delayedCall(5000, () => { this.player.speedMultiplier = 1; });
        break;

      case TILE.CORN_ICE:
        this.soundManager.powerUpIce();
        this.slidePlayer();
        break;

      case TILE.CORN_CONFUSION:
        this.player.isConfused = true;
        this.soundManager.powerUpConfusion();
        this.time.delayedCall(5000, () => { this.player.isConfused = false; });
        break;
    }
  }

  private slidePlayer() {
    // Slide right until hitting a wall or grid edge
    const level = this.proceduralLevel ?? levels[this.levelIndex];
    const grid = level.grid;
    const gridSize = grid.length;

    // Gather tiles to slide through
    const slides: [number, number][] = [];
    let col = this.player.gridCol + 1;
    while (col < gridSize && grid[this.player.gridRow][col] !== TILE.WALL) {
      slides.push([this.player.gridRow, col]);
      col++;
    }
    if (slides.length === 0) return;

    this.player.isSlideLocked = true;

    let delay = 0;
    for (const [r, c] of slides) {
      this.time.delayedCall(delay, () => {
        this.player.snapToGrid(r, c);
        this.player.emit("moved");
      });
      delay += 60;
    }

    this.time.delayedCall(delay + 50, () => {
      this.player.isSlideLocked = false;
    });
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
    if (minDist <= 2) this.soundManager.enemyNearby();
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
    this.timerEvent?.remove();
    this.enemies.forEach(e => e.stopPatrol());
    this.soundManager.gameOverLose();
    this.time.delayedCall(350, () => {
      this.scene.start(SCENES.GAME_OVER, { won: false });
    });
  }

  private advanceLevel() {
    this.soundManager.levelComplete();
    const level = levels[this.levelIndex];
    this.time.delayedCall(300, () => {
      this.scene.start(SCENES.LEVEL_COMPLETE, {
        nextLevelIndex: this.levelIndex + 1,
        totalCorn: this.totalCorn,
        vignette: level.vignette,
      });
    });
  }

  private advanceEndlessLevel() {
    this.soundManager.levelComplete();
    this.time.delayedCall(300, () => {
      this.scene.start(SCENES.LEVEL_COMPLETE, {
        nextLevelIndex: 0,
        totalCorn: this.totalCorn,
        seed: this.seed,
        runLevel: this.runLevel + 1,
        endlessMode: true,
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
    if (this.timeDisplay) this.timeDisplay.value = `00: ${String(this.timeLeft).padStart(2, "0")}`;
    if (this.cornDisplay) this.cornDisplay.value = `${this.totalCorn} :`;
  }

  update() {
    if (!this.cursors) return;
    if (this.cursors.up.isDown    || this.wasd.W.isDown) this.tryMoveWithCooldown(-1, 0);
    else if (this.cursors.down.isDown  || this.wasd.S.isDown) this.tryMoveWithCooldown(1, 0);
    else if (this.cursors.left.isDown  || this.wasd.A.isDown) this.tryMoveWithCooldown(0, -1);
    else if (this.cursors.right.isDown || this.wasd.D.isDown) this.tryMoveWithCooldown(0, 1);
  }
}
