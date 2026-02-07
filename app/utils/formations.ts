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
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
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
