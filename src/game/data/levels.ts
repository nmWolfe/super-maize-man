import { TILE } from "../utils/constants";

const _ = TILE.FLOOR;
const W = TILE.WALL;
const C = TILE.CORN;

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
}

// Level grids use [row][col] matching the original game's coordinate system.
// Original: levelMatrix[row][col].id = "blocked" / "corn"

export const levels: LevelData[] = [
  {
    name: "Level 1",
    grid: [
      // 5x5 grid
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
      // 6x6 grid
      [_, W, C, C, C, C],
      [_, W, C, C, C, C],
      [_, W, W, W, _, W],
      [_, _, _, _, _, _],
      [W, W, W, _, W, W],
      [C, _, _, _, _, C],
    ],
    timeLimit: 15,
    playerStart: [0, 0],
    cornToAdvance: 13,
  },
  {
    name: "Level 3",
    grid: [
      // 7x7 grid
      [_, _, _, _, W, _, C],
      [W, W, W, _, W, _, W],
      [_, C, W, _, _, _, _],
      [_, W, _, _, W, W, C],
      [_, _, _, _, _, W, W],
      [_, W, W, W, _, W, C],
      [_, _, C, W, _, _, _],
    ],
    timeLimit: 20,
    playerStart: [0, 0],
    cornToAdvance: 18,
    enemies: [
      {
        // Patrols row 4, cols 0–4 (all floor tiles)
        start: [4, 4],
        patrol: [[4, 0], [4, 1], [4, 2], [4, 3], [4, 4]],
        speed: 550,
      },
    ],
    fogOfWar: { enabled: true, revealRadius: 3 },
  },
  {
    name: "Level 4",
    grid: [
      // 8x8 grid
      [_, W, C, _, _, _, _, C],
      [_, W, _, W, W, W, W, _],
      [_, _, _, _, _, C, W, _],
      [_, W, _, W, W, _, _, C],
      [C, W, _, W, C, W, _, W],
      [_, W, _, W, _, _, _, _],
      [_, _, _, W, _, W, W, _],
      [C, W, _, C, _, W, C, _],
    ],
    timeLimit: 25,
    playerStart: [0, 0],
    cornToAdvance: 27,
    enemies: [
      {
        // Patrols row 2, cols 0–4 (all floor / corn tiles)
        start: [2, 0],
        patrol: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]],
        speed: 480,
      },
      {
        // Patrols row 5, cols 4–7 (all floor tiles)
        start: [5, 7],
        patrol: [[5, 4], [5, 5], [5, 6], [5, 7]],
        speed: 420,
      },
    ],
    fogOfWar: { enabled: true, revealRadius: 2 },
  },
];
