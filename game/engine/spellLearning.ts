import { ITEMS, BUILDINGS } from '../data'

// ---------------------------------------------------------------------------
// learnFromScroll
// ---------------------------------------------------------------------------

export function learnFromScroll({
  spellbook,
  inventory,
  scrollItemKey,
}: {
  spellbook: Record<string, number>
  inventory: string[]
  scrollItemKey: string
}): {
  newSpellbook: Record<string, number>
  newInventory: string[]
  spellKey: string
  newLevel: number
} | null {
  const item = ITEMS[scrollItemKey as keyof typeof ITEMS]
  if (!item || !item.grantsSpell) return null

  const idx = inventory.indexOf(scrollItemKey)
  if (idx === -1) return null

  const spellKey = item.grantsSpell
  const currentLevel = spellbook[spellKey] ?? 0
  const newLevel = currentLevel + 1

  const newSpellbook = { ...spellbook, [spellKey]: newLevel }
  const newInventory = [...inventory]
  newInventory.splice(idx, 1)

  return { newSpellbook, newInventory, spellKey, newLevel }
}

// ---------------------------------------------------------------------------
// learnFromBuilding
// ---------------------------------------------------------------------------

export function learnFromBuilding({
  spellbook,
  buildingKey,
  landType,
}: {
  spellbook: Record<string, number>
  buildingKey: string
  landType: string
}): {
  newSpellbook: Record<string, number>
  spellKey: string
  newLevel: number
} | null {
  const building = BUILDINGS[buildingKey as keyof typeof BUILDINGS]
  if (!building) return null

  const match = building.grantsSpells.find((entry) => entry.landTypeRestriction === landType)
  if (!match) return null

  const spellKey = match.spell
  const currentLevel = spellbook[spellKey] ?? 0
  const newLevel = currentLevel + 1

  const newSpellbook = { ...spellbook, [spellKey]: newLevel }

  return { newSpellbook, spellKey, newLevel }
}

// ---------------------------------------------------------------------------
// calcTrainingCost
// ---------------------------------------------------------------------------

export function calcTrainingCost(currentLevel: number): {
  gold: number
  actionPoints: number
} {
  return { gold: currentLevel * 200, actionPoints: 3 }
}

// ---------------------------------------------------------------------------
// trainSpell
// ---------------------------------------------------------------------------

export function trainSpell({
  spellbook,
  gold,
  spellKey,
  actionsUsed,
}: {
  spellbook: Record<string, number>
  gold: number
  spellKey: string
  actionsUsed: number
}): {
  newSpellbook: Record<string, number>
  goldSpent: number
  success: boolean
  reason?: string
} {
  const currentLevel = spellbook[spellKey]
  if (currentLevel === undefined) {
    return {
      newSpellbook: { ...spellbook },
      goldSpent: 0,
      success: false,
      reason: 'Spell not known',
    }
  }

  if (actionsUsed !== 0) {
    return {
      newSpellbook: { ...spellbook },
      goldSpent: 0,
      success: false,
      reason: 'No actions remaining',
    }
  }

  const cost = currentLevel * 200
  if (gold < cost) {
    return {
      newSpellbook: { ...spellbook },
      goldSpent: 0,
      success: false,
      reason: 'Not enough gold',
    }
  }

  const newSpellbook = { ...spellbook, [spellKey]: currentLevel + 1 }
  return { newSpellbook, goldSpent: cost, success: true }
}
