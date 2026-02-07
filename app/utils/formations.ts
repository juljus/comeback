export type FormationSlot = { x: number; y: number }

const FORMATIONS: Record<number, FormationSlot[]> = {
  1: [{ x: 0, y: 0 }],
  2: [
    { x: 1, y: 0 },
    { x: -1, y: 1 },
  ],
  3: [
    { x: 1, y: 0 },
    { x: -1, y: -1 },
    { x: -1, y: 1 },
  ],
  4: [
    { x: 0.9, y: 0.4 },
    { x: 0.4, y: -0.9 },
    { x: -0.4, y: 0.9 },
    { x: -0.9, y: -0.4 },
  ],
}

export function getFormationSlots(count: number): FormationSlot[] {
  if (count <= 0) return []
  if (FORMATIONS[count]) return FORMATIONS[count]!

  // Fallback for 5+: two-row spread
  const slots: FormationSlot[] = []
  const frontCount = Math.ceil(count / 2)
  const backCount = count - frontCount

  for (let i = 0; i < frontCount; i++) {
    const y = i - (frontCount - 1) / 2
    slots.push({ x: 1, y })
  }
  for (let i = 0; i < backCount; i++) {
    const y = i - (backCount - 1) / 2
    slots.push({ x: -1, y })
  }

  return slots
}

/**
 * Fortress formation: gate + archers form a vertical wall column, defender behind.
 * Expects defenders ordered as [gate, archer1, ..., archerN, landDefender].
 *
 * Layout (enemy side, before mirror flip):
 *              [archer]  x=1, y=-1.3
 *   [gate ]               x=1.5, y= 0
 *              [archer]  x=1, y= 1.3
 *                           [defender]  x=-1, y=0
 */
export function getFortressFormation(count: number): FormationSlot[] {
  if (count <= 1) return getFormationSlots(count)

  const archerCount = count - 2
  const slots: FormationSlot[] = []

  // Gate protruding from the wall, closer to allies
  slots.push({ x: 2.5, y: 0 })

  // First 2 archers flank the gate on the wall
  if (archerCount >= 1) slots.push({ x: 1, y: -1.3 })
  if (archerCount >= 2) slots.push({ x: 1, y: 1.3 })
  // 3rd+ archers go behind the wall
  if (archerCount >= 3) slots.push({ x: 0, y: -0.5 })
  if (archerCount >= 4) slots.push({ x: 0, y: 0.5 })

  // Land defender behind the wall
  slots.push({ x: -1, y: 0 })

  return slots
}
