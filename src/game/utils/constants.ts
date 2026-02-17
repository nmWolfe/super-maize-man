// Tile types for level grid data
export const TILE = {
  FLOOR: 0,
  WALL: 1,
  CORN: 2,
} as const;

export type TileType = (typeof TILE)[keyof typeof TILE];

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
} as const;

// Grid rendering
export const TILE_SIZE = 48;
