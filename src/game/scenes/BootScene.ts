import Phaser from "phaser";
import { COLORS, TILE_SIZE, SCENES } from "../utils/constants";

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.BOOT);
  }

  preload() {
    this.load.svg("player", "assets/logo.svg", {
      width: TILE_SIZE * 0.7,
      height: TILE_SIZE * 0.7,
    });
    this.load.svg("corn", "assets/corn.svg", {
      width: TILE_SIZE * 0.7,
      height: TILE_SIZE * 0.7,
    });

    // D-pad arrows
    const dpadSize = 48;
    this.load.svg("arrow-up", "assets/up.svg", { width: dpadSize, height: dpadSize });
    this.load.svg("arrow-down", "assets/down.svg", { width: dpadSize, height: dpadSize });
    this.load.svg("arrow-left", "assets/left.svg", { width: dpadSize, height: dpadSize });
    this.load.svg("arrow-right", "assets/right.svg", { width: dpadSize, height: dpadSize });
  }

  create() {
    // Generate wall tile texture with layered neon glow
    const wallGfx = this.add.graphics();
    wallGfx.fillStyle(COLORS.WALL_FILL, 1);
    wallGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    // Outer glow (soft, wide)
    wallGfx.lineStyle(3, COLORS.SECONDARY, 0.4);
    wallGfx.strokeRoundedRect(0, 0, TILE_SIZE, TILE_SIZE, 5);
    // Main neon border
    wallGfx.lineStyle(2, COLORS.SECONDARY, 1);
    wallGfx.strokeRoundedRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4, 4);
    // Inner glow
    wallGfx.lineStyle(1, COLORS.PRIMARY, 0.5);
    wallGfx.strokeRoundedRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8, 3);
    // Innermost subtle line
    wallGfx.lineStyle(1, COLORS.PRIMARY, 0.15);
    wallGfx.strokeRoundedRect(6, 6, TILE_SIZE - 12, TILE_SIZE - 12, 2);
    wallGfx.generateTexture("wall-tile", TILE_SIZE, TILE_SIZE);
    wallGfx.destroy();

    // Generate floor tile texture
    const floorGfx = this.add.graphics();
    floorGfx.fillStyle(COLORS.BACKGROUND, 1);
    floorGfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    floorGfx.lineStyle(1, COLORS.WHITE, 0.04);
    floorGfx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
    floorGfx.generateTexture("floor-tile", TILE_SIZE, TILE_SIZE);
    floorGfx.destroy();

    this.scene.start(SCENES.MENU);
  }
}
