/** Seeded random number generator (mulberry32). Returns values in [0, 1). */
export function createRng(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Return a random integer in [min, max] inclusive. */
export function randomInt(min: number, max: number, rng: () => number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

/** Roll `count` dice each with `sides` faces. Returns the sum. */
export function rollDice(count: number, sides: number, rng: () => number): number {
  let total = 0
  for (let i = 0; i < count; i++) {
    total += randomInt(1, sides, rng)
  }
  return total
}

/** Movement roll result. */
export type MovementRoll = {
  die1: number
  die2: number
  total: number
  isDoubles: boolean
}

/** Roll two movement dice. Speed bonus expands die range beyond 6. */
export function rollMovement(speedBonus: number, rng: () => number): MovementRoll {
  const sides = 6 + speedBonus
  const die1 = randomInt(1, sides, rng)
  const die2 = randomInt(1, sides, rng)
  return {
    die1,
    die2,
    total: die1 + die2,
    isDoubles: die1 === die2,
  }
}
