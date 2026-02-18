import { TILE } from "../utils/constants";
import { LevelData, EnemySpawn } from "./levels";
import { SeededRandom } from "./SeededRandom";

/**
 * Generates a LevelData using a Recursive Backtracker (DFS) maze algorithm.
 * The same seed + runLevel always produces the same maze.
 */
export function generateLevel(seed: number, runLevel: number): LevelData {
  // Combine seed + runLevel into a single deterministic seed
  const rng = new SeededRandom((seed ^ (runLevel * 0x9e3779b9)) >>> 0);

  // Difficulty curve
  const rawSize = 6 + Math.floor(runLevel / 3);
  const gridSize = Math.min(rawSize, 14);
  // Maze algorithm needs odd grid size for clean cell structure
  const mazeSize = gridSize % 2 === 0 ? gridSize + 1 : gridSize;

  const timeLimit = Math.max(15, 50 - runLevel * 2);
  const fogEnabled = runLevel >= 2;
  const fogRadius = Math.max(2, 4 - Math.floor(runLevel / 3));
  const enemySpeed = Math.max(300, 700 - runLevel * 50);
  const enemyCount = Math.min(3, Math.ceil(runLevel / 2));

  // --- Build maze via Recursive Backtracker ---
  const grid: number[][] = Array.from({ length: mazeSize }, () =>
    new Array(mazeSize).fill(TILE.WALL)
  );

  // Carve from (1,1) — DFS
  const stack: [number, number][] = [[1, 1]];
  grid[1][1] = TILE.FLOOR;

  const dirs: [number, number][] = [[-2, 0], [2, 0], [0, -2], [0, 2]];

  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    const shuffled = rng.shuffle([...dirs]);
    let moved = false;

    for (const [dr, dc] of shuffled) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr > 0 && nr < mazeSize - 1 && nc > 0 && nc < mazeSize - 1 && grid[nr][nc] === TILE.WALL) {
        // Carve the wall between current and neighbour
        grid[r + dr / 2][c + dc / 2] = TILE.FLOOR;
        grid[nr][nc] = TILE.FLOOR;
        stack.push([nr, nc]);
        moved = true;
        break;
      }
    }

    if (!moved) stack.pop();
  }

  // Add ~15% extra wall removals for loops (less perfect-maze feel)
  const extraOpens = Math.floor(mazeSize * mazeSize * 0.05);
  for (let i = 0; i < extraOpens; i++) {
    const r = rng.nextRange(1, mazeSize - 2);
    const c = rng.nextRange(1, mazeSize - 2);
    grid[r][c] = TILE.FLOOR;
  }

  // --- Place corn ---
  // Find floor tiles and weight by connectivity
  const floorTiles: [number, number, number][] = []; // [row, col, weight]
  for (let r = 1; r < mazeSize - 1; r++) {
    for (let c = 1; c < mazeSize - 1; c++) {
      if (grid[r][c] === TILE.FLOOR) {
        const neighbours = [[0,1],[0,-1],[1,0],[-1,0]].filter(
          ([dr, dc]) => grid[r + dr]?.[c + dc] === TILE.FLOOR
        ).length;
        // Dead-ends weight 3, corridors 1, intersections 2
        const weight = neighbours === 1 ? 3 : neighbours >= 3 ? 2 : 1;
        floorTiles.push([r, c, weight]);
      }
    }
  }

  // Weighted reservoir sampling for corn
  const cornCount = Math.floor(mazeSize * 1.2);
  const cornPositions: [number, number][] = [];
  const powerUpTypes = [TILE.CORN_FREEZE, TILE.CORN_SPEED, TILE.CORN_ICE, TILE.CORN_CONFUSION];

  const candidatePool: [number, number][] = [];
  for (const [r, c, w] of floorTiles) {
    for (let i = 0; i < w; i++) candidatePool.push([r, c]);
  }
  rng.shuffle(candidatePool);

  // Reserve (1,1) for player start — skip it
  for (const [r, c] of candidatePool) {
    if (r === 1 && c === 1) continue;
    // Min Chebyshev distance 3 from other corn
    const tooClose = cornPositions.some(
      ([pr, pc]) => Math.max(Math.abs(pr - r), Math.abs(pc - c)) < 3
    );
    if (!tooClose) {
      cornPositions.push([r, c]);
      if (cornPositions.length >= cornCount) break;
    }
  }

  // Scatter a couple of power-ups among corn positions
  const powerUpSlots = Math.min(2, Math.floor(cornPositions.length / 4));
  const pickedSlots = new Set<number>();
  while (pickedSlots.size < powerUpSlots) {
    pickedSlots.add(rng.nextInt(cornPositions.length));
  }

  cornPositions.forEach(([r, c], idx) => {
    if (pickedSlots.has(idx)) {
      grid[r][c] = rng.pick(powerUpTypes);
    } else {
      grid[r][c] = TILE.CORN;
    }
  });

  // --- Place enemies ---
  const enemySpawns: EnemySpawn[] = [];
  // Find horizontal runs of floor tiles ≥4 long
  type Run = { row: number; startCol: number; endCol: number };
  const runs: Run[] = [];
  for (let r = 1; r < mazeSize - 1; r++) {
    let runStart = -1;
    for (let c = 1; c < mazeSize; c++) {
      const isFloor = grid[r][c] === TILE.FLOOR || grid[r][c] === TILE.CORN ||
                      grid[r][c] === TILE.CORN_FREEZE || grid[r][c] === TILE.CORN_SPEED ||
                      grid[r][c] === TILE.CORN_ICE || grid[r][c] === TILE.CORN_CONFUSION;
      if (isFloor && runStart === -1) runStart = c;
      if (!isFloor && runStart !== -1) {
        if (c - runStart >= 4) runs.push({ row: r, startCol: runStart, endCol: c - 1 });
        runStart = -1;
      }
    }
    if (runStart !== -1 && mazeSize - 1 - runStart >= 4) {
      runs.push({ row: r, startCol: runStart, endCol: mazeSize - 2 });
    }
  }

  rng.shuffle(runs);
  const usedRows = new Set<number>();

  for (const run of runs) {
    if (enemySpawns.length >= enemyCount) break;
    if (usedRows.has(run.row)) continue;
    // Don't spawn on row 1 (player start row)
    if (run.row === 1) continue;
    usedRows.add(run.row);

    const startCol = run.startCol;
    const endCol = run.endCol;
    enemySpawns.push({
      start: [run.row, startCol],
      patrol: [[run.row, startCol], [run.row, endCol]],
      speed: enemySpeed,
    });
  }

  const cornToAdvance = cornPositions.length;

  const name =
    runLevel <= 3 ? `Maze ${runLevel}` :
    runLevel <= 6 ? `Deep Maze ${runLevel}` :
    `Nightmare Maze ${runLevel}`;

  return {
    name,
    grid,
    timeLimit,
    playerStart: [1, 1],
    cornToAdvance,
    enemies: enemySpawns.length > 0 ? enemySpawns : undefined,
    fogOfWar: fogEnabled ? { enabled: true, revealRadius: fogRadius } : undefined,
  };
}
