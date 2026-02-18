import Phaser from "phaser";
import { TILE, TILE_SIZE, SCENES } from "../utils/constants";
import { Player } from "../objects/Player";
import { BigKeith } from "../objects/BigKeith";
import { Projectile } from "../objects/Projectile";
import { SoundManager } from "../audio/SoundManager";
import { DPad } from "../ui/DPad";

const MOVE_REPEAT_DELAY = 120;

// Hand-crafted 7×7 boss arena
// W=Wall, _=Floor
const W = TILE.WALL;
const _ = TILE.FLOOR;

const ARENA_GRID: number[][] = [
  [W, W, W, W, W, W, W],
  [W, _, _, _, _, _, W],
  [W, _, W, _, W, _, W],
  [W, _, _, _, _, _, W],
  [W, _, W, _, W, _, W],
  [W, _, _, _, _, _, W],
  [W, W, W, W, W, W, W],
];

// Freeze corn positions (row, col) — one active at a time per phase
const FREEZE_CORN_POSITIONS: [number, number][] = [
  [1, 1],
  [1, 5],
  [5, 5],
];

// Keith patrol path through the arena centre
const KEITH_PATROL: [number, number][] = [
  [3, 1], [3, 2], [3, 3], [3, 4], [3, 5],
];

const PLAYER_START: [number, number] = [5, 1];
const KEITH_START: [number, number] = [3, 3];

export class BossScene extends Phaser.Scene {
  private player!: Player;
  private keith!: BigKeith;
  private soundManager!: SoundManager;
  private dpad!: DPad;

  private effectiveTileSize: number = 0;
  private gridOffsetX: number = 0;
  private gridOffsetY: number = 0;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private lastMoveTime: number = 0;

  // Freeze corn state
  private freezeCornSprites: (Phaser.GameObjects.Image | null)[] = [null, null, null];

  // HUD
  private hpText!: Phaser.GameObjects.Text;
  private cornIndicator!: Phaser.GameObjects.Text;

  // Attack overlay
  private attackOverlay!: Phaser.GameObjects.Graphics;

  // Guard flags
  private gameEnded: boolean = false;
  private inputLocked: boolean = false;

  constructor() {
    super(SCENES.BOSS);
  }

  create() {
    this.gameEnded = false;
    this.inputLocked = false;
    this.lastMoveTime = 0;

    this.soundManager = new SoundManager();

    const canvasW = this.scale.width;
    const canvasH = this.scale.height;
    const gridSize = ARENA_GRID.length; // 7
    const padding = 16;
    const availableSize = Math.min(canvasW, canvasH) - padding * 2;
    this.effectiveTileSize = Math.floor(availableSize / gridSize);

    const gridPixelSize = gridSize * this.effectiveTileSize;
    this.gridOffsetX = (canvasW - gridPixelSize) / 2;
    this.gridOffsetY = (canvasH - gridPixelSize) / 2;

    // Render arena grid
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = this.gridOffsetX + col * this.effectiveTileSize + this.effectiveTileSize / 2;
        const y = this.gridOffsetY + row * this.effectiveTileSize + this.effectiveTileSize / 2;

        const floor = this.add.image(x, y, "floor-tile");
        floor.setScale(this.effectiveTileSize / TILE_SIZE).setDepth(0);

        if (ARENA_GRID[row][col] === TILE.WALL) {
          const wall = this.add.image(x, y, "wall-tile");
          wall.setScale(this.effectiveTileSize / TILE_SIZE).setDepth(1);
        }
      }
    }

    // "DANGER ZONE" title bar above arena
    this.add.text(canvasW / 2, this.gridOffsetY - 18, "⚠ BIG KEITH'S FIELD ⚠", {
      fontFamily: "Pacifico, Tahoma",
      fontSize: "13px",
      color: "#ff4422",
      align: "center",
    }).setOrigin(0.5).setDepth(200);

    // Attack overlay (for stomp / charge visualisation)
    this.attackOverlay = this.add.graphics().setDepth(90);

    // Spawn freeze corns — all 3 positions visible initially
    this.spawnAllFreezeCorn();

    // Player
    this.player = new Player(
      this, PLAYER_START[0], PLAYER_START[1],
      this.gridOffsetX, this.gridOffsetY,
      ARENA_GRID, this.effectiveTileSize
    );
    this.player.setDepth(100);

    // Big Keith
    this.keith = new BigKeith(
      this, KEITH_START[0], KEITH_START[1],
      KEITH_PATROL,
      this.gridOffsetX, this.gridOffsetY,
      this.effectiveTileSize, ARENA_GRID
    );

    // Player movement event
    this.player.on("moved", () => {
      this.checkFreezeCornPickup();
      this.checkKeithCollision();
    });

    // Keith events
    this.keith.on("stomp", (tiles: [number, number][]) => this.handleStomp(tiles));
    this.keith.on("chargeTelegraph", () => this.handleChargeTelegraph());
    this.keith.on("chargeExecute", () => this.handleChargeExecute());
    this.keith.on("damaged", (hp: number) => {
      this.soundManager.bossHit();
      this.updateHUD(hp);
      // Respawn the next freeze corn after a short delay
      if (hp > 0) {
        this.time.delayedCall(1500, () => this.spawnNextFreezeCorn());
      }
    });
    this.keith.on("dead", () => this.handleBossDefeated());
    this.keith.on("moved", () => this.checkKeithCollision());

    // HUD
    this.buildHUD();

    // Keyboard
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      this.input.keyboard.on("keydown-SPACE", () => this.tryThrow());
    }

    // D-pad (mobile)
    this.dpad = new DPad(this, (dir) => {
      switch (dir) {
        case "up":    this.tryMovePlayer(-1, 0); break;
        case "down":  this.tryMovePlayer(1, 0);  break;
        case "left":  this.tryMovePlayer(0, -1); break;
        case "right": this.tryMovePlayer(0, 1);  break;
      }
    });
    if (!('ontouchstart' in window) && navigator.maxTouchPoints === 0) this.dpad.setVisible(false);

    // Player idle breathing tween
    this.tweens.add({
      targets: this.player,
      scaleX: this.player.scaleX * 1.05,
      scaleY: this.player.scaleY * 1.05,
      duration: 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });

    // Intro vignette — brief text then play
    this.showIntroText();

    // Cleanup
    this.events.on("shutdown", () => {
      this.keith.stopAll();
    });
  }

  // ------------------------------------------------------------------ HUD

  private buildHUD() {
    const cx = this.scale.width / 2;
    const y = this.gridOffsetY + ARENA_GRID.length * this.effectiveTileSize + 10;

    this.hpText = this.add.text(cx - 60, y, this.hpString(3), {
      fontFamily: "Pacifico, Tahoma",
      fontSize: "14px",
      color: "#ff4422",
    }).setOrigin(0, 0).setDepth(200);

    this.cornIndicator = this.add.text(cx + 10, y, "FREEZE: ○", {
      fontFamily: "Pacifico, Tahoma",
      fontSize: "14px",
      color: "#00aaff",
    }).setOrigin(0, 0).setDepth(200);
  }

  private hpString(hp: number): string {
    return "KEITH: " + "♥".repeat(hp) + "♡".repeat(3 - hp);
  }

  private updateHUD(hp: number) {
    this.hpText.setText(this.hpString(hp));
  }

  private updateCornHUD() {
    this.cornIndicator.setText(this.player.hasFreezeCorn ? "FREEZE: ●" : "FREEZE: ○");
  }

  // ------------------------------------------------------------------ Freeze corn

  private spawnAllFreezeCorn() {
    // Spawn all 3 initially (they get removed as player picks them up)
    FREEZE_CORN_POSITIONS.forEach(([row, col], i) => {
      this.spawnFreezeCornAt(i, row, col);
    });
  }

  private spawnFreezeCornAt(index: number, row: number, col: number) {
    const x = this.gridOffsetX + col * this.effectiveTileSize + this.effectiveTileSize / 2;
    const y = this.gridOffsetY + row * this.effectiveTileSize + this.effectiveTileSize / 2;
    const sprite = this.add.image(x, y, "powerup-3"); // Freeze corn texture
    sprite.setScale((this.effectiveTileSize * 0.6) / sprite.width).setDepth(10);

    // Bob animation
    this.tweens.add({
      targets: sprite,
      y: sprite.y - 4,
      duration: 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
      delay: index * 150,
    });

    this.freezeCornSprites[index] = sprite;
  }

  private checkFreezeCornPickup() {
    FREEZE_CORN_POSITIONS.forEach(([row, col], i) => {
      const sprite = this.freezeCornSprites[i];
      if (!sprite) return;
      if (this.player.gridRow === row && this.player.gridCol === col) {
        // Pick up
        sprite.destroy();
        this.freezeCornSprites[i] = null;
        this.player.hasFreezeCorn = true;
        this.updateCornHUD();
        this.soundManager.powerUpFreeze();
      }
    });
  }

  private spawnNextFreezeCorn() {
    // Find an empty slot and spawn there
    const emptyIndex = this.freezeCornSprites.findIndex(s => s === null);
    if (emptyIndex === -1) return; // all already spawned
    const [row, col] = FREEZE_CORN_POSITIONS[emptyIndex];
    // Don't spawn on player or Keith
    if (
      (this.player.gridRow === row && this.player.gridCol === col) ||
      (this.keith.gridRow === row && this.keith.gridCol === col)
    ) {
      // Delay slightly and retry
      this.time.delayedCall(1000, () => this.spawnNextFreezeCorn());
      return;
    }
    this.spawnFreezeCornAt(emptyIndex, row, col);
  }

  // ------------------------------------------------------------------ Throwing

  private tryThrow() {
    if (this.gameEnded || this.inputLocked) return;
    if (!this.player.hasFreezeCorn) return;
    if (this.player.lastDRow === 0 && this.player.lastDCol === 0) return;

    this.player.hasFreezeCorn = false;
    this.updateCornHUD();

    new Projectile(
      this,
      this.player.gridRow,
      this.player.gridCol,
      this.player.lastDRow,
      this.player.lastDCol,
      this.gridOffsetX,
      this.gridOffsetY,
      this.effectiveTileSize,
      ARENA_GRID,
      (r, c) => {
        if (r === this.keith.gridRow && c === this.keith.gridCol) {
          this.keith.takeDamage();
          return true; // stop projectile
        }
        return false;
      }
    ).launch();
  }

  // ------------------------------------------------------------------ Attack handlers

  private handleStomp(tiles: [number, number][]) {
    if (this.gameEnded) return;

    // Orange warning flash
    this.flashTiles(tiles, 0xff8800, 0.6, 1000);

    // After 1 second — check player position
    this.time.delayedCall(1000, () => {
      if (this.gameEnded) return;
      const inDanger = tiles.some(
        ([r, c]) => r === this.player.gridRow && c === this.player.gridCol
      );
      if (inDanger) {
        this.flashTiles(tiles, 0xff2200, 1.0, 200);
        this.handlePlayerDeath();
      } else {
        this.attackOverlay.clear();
      }
    });
  }

  private handleChargeTelegraph() {
    if (this.gameEnded) return;
    this.soundManager.bossCharge();

    // Determine whether to charge along Keith's current row or column
    // Pick the row or column that the player is on, if aligned; otherwise use Keith's row
    const useRow = this.player.gridRow === this.keith.gridRow ||
                   Math.abs(this.player.gridRow - this.keith.gridRow) >= Math.abs(this.player.gridCol - this.keith.gridCol);

    const chargeRow = useRow ? this.keith.gridRow : null;
    const chargeCol = useRow ? null : this.keith.gridCol;

    // Build list of tiles to highlight
    const tiles: [number, number][] = [];
    const gridSize = ARENA_GRID.length;
    if (chargeRow !== null) {
      for (let c = 0; c < gridSize; c++) {
        if (ARENA_GRID[chargeRow][c] !== TILE.WALL) tiles.push([chargeRow, c]);
      }
    } else if (chargeCol !== null) {
      for (let r = 0; r < gridSize; r++) {
        if (ARENA_GRID[r][chargeCol] !== TILE.WALL) tiles.push([r, chargeCol]);
      }
    }

    // Store for chargeExecute
    (this as unknown as { _chargeTiles: [number, number][] })._chargeTiles = tiles;
    this.flashTiles(tiles, 0xff3300, 0.5, 1500);
  }

  private handleChargeExecute() {
    if (this.gameEnded) return;
    this.attackOverlay.clear();

    const tiles: [number, number][] = (this as unknown as { _chargeTiles: [number, number][] })._chargeTiles ?? [];
    if (tiles.length === 0) return;

    // Slide Keith across all tiles in the charge path rapidly
    let delay = 0;
    for (const [r, c] of tiles) {
      this.time.delayedCall(delay, () => {
        if (this.gameEnded) return;
        this.keith.tweenTo(r, c);
        // Check player collision each step
        if (r === this.player.gridRow && c === this.player.gridCol) {
          this.handlePlayerDeath();
        }
      });
      delay += 60;
    }
  }

  private flashTiles(tiles: [number, number][], color: number, alpha: number, duration: number) {
    this.attackOverlay.clear();
    this.attackOverlay.fillStyle(color, alpha);
    for (const [r, c] of tiles) {
      const x = this.gridOffsetX + c * this.effectiveTileSize;
      const y = this.gridOffsetY + r * this.effectiveTileSize;
      this.attackOverlay.fillRect(x, y, this.effectiveTileSize, this.effectiveTileSize);
    }
    this.time.delayedCall(duration, () => this.attackOverlay.clear());
  }

  // ------------------------------------------------------------------ Collision

  private checkKeithCollision() {
    if (this.gameEnded) return;
    if (this.player.gridRow === this.keith.gridRow && this.player.gridCol === this.keith.gridCol) {
      this.handlePlayerDeath();
    }
  }

  // ------------------------------------------------------------------ Win / Lose

  private handlePlayerDeath() {
    if (this.gameEnded) return;
    this.gameEnded = true;
    this.inputLocked = true;
    this.keith.stopAll();
    this.time.delayedCall(300, () => {
      this.scene.start(SCENES.GAME_OVER, { won: false });
    });
  }

  private handleBossDefeated() {
    if (this.gameEnded) return;
    this.gameEnded = true;
    this.inputLocked = true;
    this.keith.stopAll();
    this.attackOverlay.clear();
    this.soundManager.bossDefeat();
    this.time.delayedCall(800, () => {
      this.scene.start(SCENES.GAME_OVER, { won: true, fromBoss: true });
    });
  }

  // ------------------------------------------------------------------ Intro

  private showIntroText() {
    this.inputLocked = true;
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    const bg = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.8).setDepth(300);
    const title = this.add.text(cx, cy - 30, "BIG KEITH", {
      fontFamily: "Pacifico, Tahoma",
      fontSize: "34px",
      color: "#ff4422",
    }).setOrigin(0.5).setAlpha(0).setDepth(301);
    const sub = this.add.text(cx, cy + 20, "He's here. He's furious.\nPick up freeze corn and THROW it at him.", {
      fontFamily: '"Josefin Sans", Tahoma',
      fontSize: "12px",
      color: "#ffffff",
      align: "center",
    }).setOrigin(0.5).setAlpha(0).setDepth(301);

    this.tweens.add({ targets: title, alpha: 1, duration: 400, delay: 200 });
    this.tweens.add({ targets: sub, alpha: 1, duration: 400, delay: 700 });

    this.time.delayedCall(2400, () => {
      this.tweens.add({
        targets: [bg, title, sub],
        alpha: 0,
        duration: 400,
        onComplete: () => {
          bg.destroy(); title.destroy(); sub.destroy();
          this.inputLocked = false;
        },
      });
    });
  }

  // ------------------------------------------------------------------ Update

  update() {
    if (!this.cursors || this.inputLocked || this.gameEnded) return;

    const now = this.time.now;
    if (now - this.lastMoveTime < MOVE_REPEAT_DELAY) return;

    let moved = false;
    if (this.cursors.up.isDown    || this.wasd.W.isDown) moved = this.tryMovePlayer(-1, 0);
    else if (this.cursors.down.isDown  || this.wasd.S.isDown) moved = this.tryMovePlayer(1, 0);
    else if (this.cursors.left.isDown  || this.wasd.A.isDown) moved = this.tryMovePlayer(0, -1);
    else if (this.cursors.right.isDown || this.wasd.D.isDown) moved = this.tryMovePlayer(0, 1);

    if (moved) this.lastMoveTime = now;
  }

  private tryMovePlayer(dRow: number, dCol: number): boolean {
    return this.player.tryMove(dRow, dCol);
  }
}
