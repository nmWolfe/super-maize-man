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

    // Power-up corn textures — corn-cob shapes, tinted per type
    this.makePowerUpTexture(ts, 3, 0x00aaff, "freeze"); // Freeze — ice blue
    this.makePowerUpTexture(ts, 4, 0xff8800, "speed");  // Speed  — orange
    this.makePowerUpTexture(ts, 5, 0x88ccff, "ice");    // Ice    — pale blue
    this.makePowerUpTexture(ts, 6, 0xaa44ff, "confuse");// Confusion — purple

    this.scene.start(SCENES.MENU);
  }

  private makePowerUpTexture(ts: number, tileType: number, color: number, symbol: "freeze" | "speed" | "ice" | "confuse") {
    const key = `powerup-${tileType}`;
    const p = this.add.graphics();

    // Corn cob geometry
    const cx = ts * 0.5;
    const cobCy = ts * 0.40;  // cob center — slightly above mid so husk fits below
    const cw = ts * 0.22;     // half-width of cob
    const ch = ts * 0.30;     // half-height of cob

    // --- Glow aura in power-up color ---
    p.fillStyle(color, 0.22);
    p.fillEllipse(cx, cobCy, (cw + 7) * 2, (ch + 7) * 2);

    // --- Corn body (golden yellow base) ---
    p.fillStyle(0xffcc00, 1);
    p.fillEllipse(cx, cobCy, cw * 2, ch * 2);

    // --- Color tint overlay ---
    p.fillStyle(color, 0.45);
    p.fillEllipse(cx, cobCy, cw * 2, ch * 2);

    // --- Neon rim ---
    p.lineStyle(2, color, 1);
    p.strokeEllipse(cx, cobCy, cw * 2, ch * 2);

    // --- Kernel rows (3 cols × 5 rows of dots) ---
    p.fillStyle(0xaa6600, 0.65);
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        const kx = cx - cw * 0.55 + col * cw * 0.55;
        const ky = cobCy - ch * 0.70 + row * ch * 0.35;
        p.fillCircle(kx, ky, ts * 0.028);
      }
    }

    // --- Husk leaves at base ---
    p.lineStyle(2.5, 0x44bb44, 1);
    p.lineBetween(cx - cw * 0.25, cobCy + ch * 0.88, cx - cw * 1.05, cobCy + ch * 1.45);
    p.lineBetween(cx + cw * 0.25, cobCy + ch * 0.88, cx + cw * 1.05, cobCy + ch * 1.45);
    p.lineStyle(2, 0x44bb44, 0.6);
    p.lineBetween(cx, cobCy + ch * 0.95, cx, cobCy + ch * 1.45);

    // --- Symbol overlaid on cob (white, small) ---
    const sr = ts * 0.11;     // symbol radius
    const sy = cobCy;         // symbol centred on cob
    p.lineStyle(1.5, 0xffffff, 0.95);

    if (symbol === "freeze") {
      // Snowflake — 3 crossing lines at 60° intervals
      for (let a = 0; a < 3; a++) {
        const rad = (a * 60 * Math.PI) / 180;
        p.lineBetween(
          cx + Math.cos(rad) * sr, sy + Math.sin(rad) * sr,
          cx - Math.cos(rad) * sr, sy - Math.sin(rad) * sr
        );
      }
    } else if (symbol === "speed") {
      // Lightning bolt
      p.lineBetween(cx - sr * 0.3, sy - sr, cx + sr * 0.15, sy + sr * 0.1);
      p.lineBetween(cx - sr * 0.15, sy - sr * 0.1, cx + sr * 0.3, sy + sr);
    } else if (symbol === "ice") {
      // Double-headed arrow (→ and ←, slide both ways)
      p.lineBetween(cx - sr * 0.9, sy, cx + sr * 0.9, sy);
      p.lineBetween(cx + sr * 0.45, sy - sr * 0.45, cx + sr * 0.9, sy);
      p.lineBetween(cx + sr * 0.45, sy + sr * 0.45, cx + sr * 0.9, sy);
      p.lineBetween(cx - sr * 0.45, sy - sr * 0.45, cx - sr * 0.9, sy);
      p.lineBetween(cx - sr * 0.45, sy + sr * 0.45, cx - sr * 0.9, sy);
    } else if (symbol === "confuse") {
      // Question mark — top arc + stem + dot
      p.lineBetween(cx - sr * 0.45, sy - sr * 0.65, cx + sr * 0.45, sy - sr * 0.65);
      p.lineBetween(cx + sr * 0.45, sy - sr * 0.65, cx + sr * 0.45, sy - sr * 0.05);
      p.lineBetween(cx + sr * 0.45, sy - sr * 0.05, cx, sy + sr * 0.25);
      p.fillStyle(0xffffff, 0.95);
      p.fillCircle(cx, sy + sr * 0.65, ts * 0.022);
    }

    p.generateTexture(key, ts, ts);
    p.destroy();
  }
}
