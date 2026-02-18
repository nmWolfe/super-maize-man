import { TILE } from "../utils/constants";

const _ = TILE.FLOOR;
const W = TILE.WALL;
const C = TILE.CORN;
const F = TILE.CORN_FREEZE;
const S = TILE.CORN_SPEED;
const I = TILE.CORN_ICE;
const X = TILE.CORN_CONFUSION;

export interface EnemySpawn {
  start: [number, number];       // [row, col]
  patrol: [number, number][];    // waypoints to patrol between (back and forth)
  speed: number;                 // ms between moves
}

export interface LevelData {
  name: string;
  grid: number[][];
  timeLimit: number;
  playerStart: [number, number]; // [row, col]
  cornToAdvance: number; // cumulative corn count to trigger next level
  enemies?: EnemySpawn[];
  fogOfWar?: { enabled: boolean; revealRadius: number };
  vignette?: { title: string; lines: string[] };
}

export const levels: LevelData[] = [
  {
    name: "Level 1",
    grid: [
      // 5x5 grid — no power-ups, gentle intro
      [_, _, _, _, C],
      [W, W, W, W, _],
      [C, _, _, _, _],
      [_, W, W, W, W],
      [_, _, _, _, C],
    ],
    timeLimit: 10,
    playerStart: [0, 0],
    cornToAdvance: 3,
  },
  {
    name: "Level 2",
    grid: [
      // 6x6 grid — one freeze, one ice
      [_, W, C, C, C, C],
      [_, W, C, C, F, C],  // F = freeze power-up
      [_, W, W, W, _, W],
      [_, _, _, _, _, _],
      [W, W, W, _, W, W],
      [C, _, _, I, _, C],  // I = ice power-up
    ],
    timeLimit: 15,
    playerStart: [0, 0],
    cornToAdvance: 13,
  },
  {
    name: "Level 3",
    grid: [
      // 7x7 — two safe flanking routes at col 0 and col 6
      // Gerald patrols row 4 cols 1–5 only; left/right flanks are always safe
      [_, _, _, _, _, _, C],  // open top row, corn at far right
      [W, W, W, W, W, W, _],  // solid wall — only gap at col 6 (right flank down)
      [_, _, C, _, _, _, _],  // open corridor; corn at col 2
      [_, W, W, W, W, W, _],  // wall with gaps at col 0 and col 6
      [_, _, _, C, _, _, _],  // Gerald patrols cols 1–5; centre corn is risky
      [_, W, W, W, W, W, _],  // wall with gaps at col 0 and col 6
      [S, _, _, _, _, _, X],  // speed power-up left, confusion right
    ],
    timeLimit: 20,
    playerStart: [0, 0],
    cornToAdvance: 18,
    enemies: [
      {
        // Gerald patrols row 4, cols 1–5 — col 0 and col 6 are always safe
        start: [4, 1],
        patrol: [[4, 1], [4, 2], [4, 3], [4, 4], [4, 5]],
        speed: 550,
      },
    ],
    vignette: {
      title: "Heavy Boots",
      lines: [
        "You can hear them now.",
        "Gerald. Dave.",
        "And someone new...",
        '"Big Keith has arrived," whispers the wind.',
      ],
    },
  },
  {
    name: "Level 4",
    grid: [
      // 8x8 grid — mix of all power-ups
      [_, W, C, _, _, _, _, C],
      [_, W, _, W, W, W, W, _],
      [_, _, _, _, _, C, W, _],
      [_, W, _, W, W, _, F, C],  // F = freeze
      [C, W, _, W, C, W, _, W],
      [_, W, _, W, S, _, _, _],  // S = speed
      [_, _, _, W, _, W, W, _],
      [C, W, I, C, _, W, C, X],  // I = ice, X = confusion
    ],
    timeLimit: 25,
    playerStart: [0, 0],
    cornToAdvance: 27,
    enemies: [
      {
        // Gerald patrols row 2, cols 0–4
        start: [2, 0],
        patrol: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]],
        speed: 480,
      },
      {
        // Dave patrols row 5, cols 4–7
        start: [5, 7],
        patrol: [[5, 4], [5, 5], [5, 6], [5, 7]],
        speed: 420,
      },
    ],
    fogOfWar: { enabled: true, revealRadius: 2 },
  },
];
