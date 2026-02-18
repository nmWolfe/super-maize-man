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

    // Corn burst particle — small yellow dot
    const kernelGfx = this.add.graphics();
    kernelGfx.fillStyle(COLORS.PRIMARY, 1);
    kernelGfx.fillCircle(4, 4, 4);
    kernelGfx.generateTexture("kernel", 8, 8);
    kernelGfx.destroy();

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

    // Power-up corn textures — glowing neon circles with symbols
    this.makePowerUpTexture(ts, 3, 0x00aaff, "freeze"); // Freeze — ice blue
    this.makePowerUpTexture(ts, 4, 0xffcc00, "speed");  // Speed  — gold
    this.makePowerUpTexture(ts, 5, 0xddeeff, "ice");    // Ice    — pale blue
    this.makePowerUpTexture(ts, 6, 0xaa44ff, "confuse");// Confusion — purple

    this.scene.start(SCENES.MENU);
  }

  private makePowerUpTexture(ts: number, tileType: number, color: number, symbol: "freeze" | "speed" | "ice" | "confuse") {
    const key = `powerup-${tileType}`;
    const cx = ts / 2;
    const cy = ts / 2;
    const r = ts * 0.33;

    const p = this.add.graphics();
    // Outer glow
    p.fillStyle(color, 0.2);
    p.fillCircle(cx, cy, r + 5);
    // Main body
    p.fillStyle(color, 0.85);
    p.fillCircle(cx, cy, r);
    // Neon rim
    p.lineStyle(2, color, 1);
    p.strokeCircle(cx, cy, r);

    // Symbol drawn in dark contrasting colour
    p.lineStyle(2, 0x111111, 0.9);

    if (symbol === "freeze") {
      // Snowflake: 3 crossing lines through centre
      for (let angle = 0; angle < 180; angle += 60) {
        const rad = (angle * Math.PI) / 180;
        p.lineBetween(
          cx + Math.cos(rad) * r * 0.65, cy + Math.sin(rad) * r * 0.65,
          cx - Math.cos(rad) * r * 0.65, cy - Math.sin(rad) * r * 0.65
        );
      }
    } else if (symbol === "speed") {
      // Lightning bolt (two diagonal lines)
      p.lineBetween(cx - 4, cy - r * 0.55, cx + 2, cy + 2);
      p.lineBetween(cx - 2, cy - 2, cx + 4, cy + r * 0.55);
      p.lineBetween(cx - 4, cy - r * 0.55, cx + 4, cy + r * 0.55);
    } else if (symbol === "ice") {
      // Arrow pointing right (slide direction)
      p.lineBetween(cx - r * 0.5, cy, cx + r * 0.5, cy);
      p.lineBetween(cx + r * 0.25, cy - r * 0.3, cx + r * 0.5, cy);
      p.lineBetween(cx + r * 0.25, cy + r * 0.3, cx + r * 0.5, cy);
    } else if (symbol === "confuse") {
      // Question mark using two segments
      p.lineBetween(cx - r * 0.2, cy - r * 0.45, cx + r * 0.2, cy - r * 0.45);
      p.lineBetween(cx + r * 0.2, cy - r * 0.45, cx + r * 0.2, cy);
      p.lineBetween(cx + r * 0.2, cy, cx, cy + r * 0.15);
      // dot
      p.fillStyle(0x111111, 0.9);
      p.fillCircle(cx, cy + r * 0.42, 2.5);
    }

    p.generateTexture(key, ts, ts);
    p.destroy();
  }
}
