import Phaser from "phaser";
import { COLORS, TILE_SIZE, SCENES } from "../utils/constants";

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.BOOT);
  }

  preload() {
    // Load SVGs at 4× base size so they're crisp when scaled down in-game
    const svgSize = TILE_SIZE * 4;
    this.load.svg("player", "assets/logo.svg", { width: svgSize, height: svgSize });
    this.load.svg("corn", "assets/corn.svg", { width: svgSize, height: svgSize });

    // D-pad arrows — load at 2× for clean scaling
    const dpadSize = 96;
    this.load.svg("arrow-up", "assets/up.svg", { width: dpadSize, height: dpadSize });
    this.load.svg("arrow-down", "assets/down.svg", { width: dpadSize, height: dpadSize });
    this.load.svg("arrow-left", "assets/left.svg", { width: dpadSize, height: dpadSize });
    this.load.svg("arrow-right", "assets/right.svg", { width: dpadSize, height: dpadSize });
  }

  create() {
    const ts = TILE_SIZE;

    // Generate wall tile texture with layered neon glow
    const wallGfx = this.add.graphics();
    wallGfx.fillStyle(COLORS.WALL_FILL, 1);
    wallGfx.fillRect(0, 0, ts, ts);
    wallGfx.lineStyle(3, COLORS.SECONDARY, 0.4);
    wallGfx.strokeRoundedRect(0, 0, ts, ts, 5);
    wallGfx.lineStyle(2, COLORS.SECONDARY, 1);
    wallGfx.strokeRoundedRect(2, 2, ts - 4, ts - 4, 4);
    wallGfx.lineStyle(1, COLORS.PRIMARY, 0.5);
    wallGfx.strokeRoundedRect(4, 4, ts - 8, ts - 8, 3);
    wallGfx.lineStyle(1, COLORS.PRIMARY, 0.15);
    wallGfx.strokeRoundedRect(6, 6, ts - 12, ts - 12, 2);
    wallGfx.generateTexture("wall-tile", ts, ts);
    wallGfx.destroy();

    // Generate floor tile texture
    const floorGfx = this.add.graphics();
    floorGfx.fillStyle(COLORS.BACKGROUND, 1);
    floorGfx.fillRect(0, 0, ts, ts);
    floorGfx.lineStyle(1, COLORS.WHITE, 0.04);
    floorGfx.strokeRect(0, 0, ts, ts);
    floorGfx.generateTexture("floor-tile", ts, ts);
    floorGfx.destroy();

    // Generate farmer enemy texture — neon silhouette style
    const g = this.add.graphics();

    // --- Straw hat brim (wide yellow ellipse) ---
    g.fillStyle(COLORS.BACKGROUND, 1);
    g.fillEllipse(ts * 0.42, ts * 0.2, ts * 0.72, ts * 0.17);
    g.lineStyle(2, COLORS.PRIMARY, 1);
    g.strokeEllipse(ts * 0.42, ts * 0.2, ts * 0.72, ts * 0.17);

    // --- Hat crown ---
    g.fillStyle(COLORS.BACKGROUND, 1);
    g.fillRect(ts * 0.28, ts * 0.07, ts * 0.28, ts * 0.15);
    g.lineStyle(2, COLORS.PRIMARY, 1);
    g.strokeRect(ts * 0.28, ts * 0.07, ts * 0.28, ts * 0.15);
    // Hat band
    g.lineStyle(2, COLORS.SECONDARY, 0.7);
    g.lineBetween(ts * 0.28, ts * 0.19, ts * 0.56, ts * 0.19);

    // --- Head ---
    g.fillStyle(COLORS.BACKGROUND, 1);
    g.fillCircle(ts * 0.42, ts * 0.33, ts * 0.14);
    g.lineStyle(1.5, COLORS.SECONDARY, 1);
    g.strokeCircle(ts * 0.42, ts * 0.33, ts * 0.14);
    // Red glowing eyes
    g.fillStyle(0xff2020, 1);
    g.fillCircle(ts * 0.36, ts * 0.31, ts * 0.04);
    g.fillCircle(ts * 0.48, ts * 0.31, ts * 0.04);
    // Sinister grin
    g.lineStyle(1.5, COLORS.SECONDARY, 0.8);
    g.beginPath();
    g.arc(ts * 0.42, ts * 0.34, ts * 0.07, 0.2, Math.PI - 0.2);
    g.strokePath();

    // --- Body (overalls) ---
    g.fillStyle(0x1a3580, 1);
    g.fillRect(ts * 0.26, ts * 0.48, ts * 0.36, ts * 0.32);
    g.lineStyle(1.5, COLORS.SECONDARY, 0.9);
    g.strokeRect(ts * 0.26, ts * 0.48, ts * 0.36, ts * 0.32);
    // Dungaree straps
    g.lineStyle(2, COLORS.SECONDARY, 0.6);
    g.lineBetween(ts * 0.31, ts * 0.46, ts * 0.31, ts * 0.48);
    g.lineBetween(ts * 0.53, ts * 0.46, ts * 0.53, ts * 0.48);
    // Pocket
    g.lineStyle(1, COLORS.SECONDARY, 0.5);
    g.strokeRect(ts * 0.33, ts * 0.56, ts * 0.14, ts * 0.1);

    // --- Legs ---
    g.fillStyle(0x1a3580, 1);
    g.fillRect(ts * 0.26, ts * 0.79, ts * 0.14, ts * 0.12);
    g.fillRect(ts * 0.44, ts * 0.79, ts * 0.14, ts * 0.12);
    g.lineStyle(1, COLORS.SECONDARY, 0.8);
    g.strokeRect(ts * 0.26, ts * 0.79, ts * 0.14, ts * 0.12);
    g.strokeRect(ts * 0.44, ts * 0.79, ts * 0.14, ts * 0.12);

    // --- Pitchfork (right side) ---
    g.lineStyle(2, COLORS.PRIMARY, 1);
    // Handle
    g.lineBetween(ts * 0.77, ts * 0.1, ts * 0.77, ts * 0.92);
    // Tines (3 prongs)
    g.lineBetween(ts * 0.69, ts * 0.1, ts * 0.69, ts * 0.3);
    g.lineBetween(ts * 0.77, ts * 0.1, ts * 0.77, ts * 0.3);
    g.lineBetween(ts * 0.85, ts * 0.1, ts * 0.85, ts * 0.3);
    // Crossbar
    g.lineBetween(ts * 0.69, ts * 0.3, ts * 0.85, ts * 0.3);

    g.generateTexture("enemy", ts, ts);
    g.destroy();

    this.scene.start(SCENES.MENU);
  }
}
