import Phaser from "phaser";
import { TILE, TILE_SIZE, SCENES } from "../utils/constants";
import { levels } from "../data/levels";
import { Player } from "../objects/Player";
import { Corn } from "../objects/Corn";
import { DPad } from "../ui/DPad";
import { SoundManager } from "../audio/SoundManager";

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

  constructor() {
    super(SCENES.GAME);
  }

  init(data: { levelIndex: number; totalCorn: number }) {
    this.levelIndex = data.levelIndex ?? 0;
    this.totalCorn = data.totalCorn ?? 0;
    this.corns = [];
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
        floor.setScale(this.effectiveTileSize / TILE_SIZE);

        if (tileType === TILE.WALL) {
          const wall = this.add.image(x, y, "wall-tile");
          wall.setScale(this.effectiveTileSize / TILE_SIZE);
        } else if (tileType === TILE.CORN) {
          const corn = new Corn(this, row, col, this.gridOffsetX, this.gridOffsetY, this.effectiveTileSize);
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

    // Listen for player movement to check corn collection
    this.player.on("moved", () => {
      this.checkCornCollection();
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
