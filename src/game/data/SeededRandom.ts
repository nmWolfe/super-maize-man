/** Mulberry32 PRNG — fast, good quality, seedable */
export class SeededRandom {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed !== undefined ? seed >>> 0 : (Date.now() & 0x7fffffff);
  }

  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  nextRange(min: number, max: number): number {
    return min + this.nextInt(max - min + 1);
  }

  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  pick<T>(arr: T[]): T {
    return arr[this.nextInt(arr.length)];
  }
}
