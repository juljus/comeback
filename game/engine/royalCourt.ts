import type { PlayerState } from '../types/player'
import type { BoardSquare } from '../types/board'
import type { TitleRank } from '../types/enums'
import { LANDS } from '../data'
import { calcTaxIncome, calcBankBonus, calcTitleSalary } from './formulas'
import { regenLandIncome, calcTitle, generateKingsGift } from './economy'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BOARD_SIZE = 34

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LandRegenEntry = {
  squareIndex: number
  oldIncome: number
  newIncome: number
}

export type RecruitReplenishEntry = {
  squareIndex: number
  unitKey: string
  oldCount: number
  newCount: number
}

export type RoyalCourtResult = {
  taxIncome: number
  bankBonus: number
  titleSalary: number
  totalIncome: number
  newTitle: TitleRank
  titleChanged: boolean
  kingsGift: string[]
  regenReport: LandRegenEntry[]
  recruitReplenish: RecruitReplenishEntry[]
}

// ---------------------------------------------------------------------------
// didPassRoyalCourt
// ---------------------------------------------------------------------------

/** Detect whether movement crosses the Royal Court boundary (wrapping past square 33). */
export function didPassRoyalCourt(oldPosition: number, moveDistance: number): boolean {
  return oldPosition + moveDistance >= BOARD_SIZE
}

// ---------------------------------------------------------------------------
// countBanks
// ---------------------------------------------------------------------------

/** Count how many owned squares have a built bank building. */
export function countBanks(
  ownedSquareIndices: number[],
  board: ReadonlyArray<BoardSquare>,
): number {
  let count = 0
  for (const idx of ownedSquareIndices) {
    const square = board[idx]!
    const landDef = LANDS[square.landKey as keyof typeof LANDS]
    if (!landDef) continue

    const bankIndex = (landDef.buildings as readonly string[]).indexOf('bank')
    if (bankIndex === -1) continue

    if (square.buildings[bankIndex]) {
      count++
    }
  }
  return count
}

// ---------------------------------------------------------------------------
// resolveRoyalCourtPassing
// ---------------------------------------------------------------------------

/** Resolve all effects of passing Royal Court: income, regen, title, gift. */
export function resolveRoyalCourtPassing(params: {
  player: PlayerState
  board: BoardSquare[]
  rng: () => number
}): {
  newPlayer: PlayerState
  newBoard: BoardSquare[]
  result: RoyalCourtResult
} {
  const { player, board, rng } = params

  // 1. Find owned squares
  const ownedIndices: number[] = []
  const ownedSquares: Array<{ taxIncome: number }> = []
  for (let i = 0; i < board.length; i++) {
    if (board[i]!.owner === player.id) {
      ownedIndices.push(i)
      ownedSquares.push({ taxIncome: board[i]!.taxIncome })
    }
  }

  // 2. Tax income
  const taxIncome = calcTaxIncome(ownedSquares)

  // 3. Bank bonus
  const banksOwned = countBanks(ownedIndices, board)
  const bankBonus = calcBankBonus(ownedSquares.length, banksOwned)

  // 4. Title salary (uses current title before any upgrade)
  const titleSalary = calcTitleSalary(player.title)

  // 5. Total income
  const totalIncome = taxIncome + bankBonus + titleSalary

  // 6. Regenerate land income
  const newBoard = board.map((sq) => ({ ...sq, mana: { ...sq.mana } }))
  const regenReport: LandRegenEntry[] = []

  for (const idx of ownedIndices) {
    const square = newBoard[idx]!
    const landDef = LANDS[square.landKey as keyof typeof LANDS]
    if (!landDef) continue

    const oldIncome = square.taxIncome
    const newIncome = regenLandIncome({
      currentIncome: oldIncome,
      baseIncome: landDef.taxIncome,
    })
    square.taxIncome = newIncome
    regenReport.push({ squareIndex: idx, oldIncome, newIncome })
  }

  // 7. Recruitable unit replenishment (25% chance per owned land with a recruitable unit)
  const recruitReplenish: RecruitReplenishEntry[] = []
  for (const idx of ownedIndices) {
    const square = newBoard[idx]!
    if (square.recruitableUnit && rng() < 0.25) {
      const oldCount = square.recruitableCount
      square.recruitableCount += 1
      recruitReplenish.push({
        squareIndex: idx,
        unitKey: square.recruitableUnit,
        oldCount,
        newCount: square.recruitableCount,
      })
    }
  }

  // 8. Title check
  const newTitle = calcTitle(ownedSquares.length, player.title)
  const titleChanged = newTitle !== player.title

  // 9. King's Gift
  const kingsGift = titleChanged ? generateKingsGift({ title: newTitle, rng }) : []

  // 10. Build new player
  const newPlayer: PlayerState = {
    ...player,
    gold: player.gold + totalIncome,
    title: newTitle,
    equipment: { ...player.equipment },
    mana: { ...player.mana },
    manaRegen: { ...player.manaRegen },
    elementalDamage: { ...player.elementalDamage },
    inventory: [...player.inventory],
    companions: [...player.companions],
    ownedLands: [...player.ownedLands],
    spellbook: { ...player.spellbook },
  }

  return {
    newPlayer,
    newBoard,
    result: {
      taxIncome,
      bankBonus,
      titleSalary,
      totalIncome,
      newTitle,
      titleChanged,
      kingsGift,
      regenReport,
      recruitReplenish,
    },
  }
}
