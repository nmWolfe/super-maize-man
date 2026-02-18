// Tile types for level grid data
export const TILE = {
  FLOOR: 0,
  WALL: 1,
  CORN: 2,
  CORN_FREEZE:    3,
  CORN_SPEED:     4,
  CORN_ICE:       5,
  CORN_CONFUSION: 6,
} as const;

export type TileType = (typeof TILE)[keyof typeof TILE];

// Colour per power-up tile type
export const POWERUP_COLORS: Record<number, number> = {
  3: 0x00aaff,  // Freeze — ice blue
  4: 0xffcc00,  // Speed  — gold
  5: 0xddeeff,  // Ice    — pale white-blue
  6: 0xaa44ff,  // Confusion — purple
};

// Neon color palette (matches SCSS variables)
export const COLORS = {
  BACKGROUND: 0x35373e,
  PRIMARY: 0xffea00,
  SECONDARY: 0xf6da76,
  WHITE: 0xffffff,
  WALL_FILL: 0x35373e,
  ENEMY: 0xff4444,
  ENEMY_GLOW: 0xff8888,
} as const;

// Scene keys
export const SCENES = {
  BOOT: "BootScene",
  MENU: "MenuScene",
  GAME: "GameScene",
  LEVEL_COMPLETE: "LevelCompleteScene",
  GAME_OVER: "GameOverScene",
  ENDLESS_MENU: "EndlessMenuScene",
} as const;

// Grid rendering
export const TILE_SIZE = 48;
