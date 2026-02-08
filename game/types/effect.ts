/** Active status/buff effect from effects.csv (runtime) */
export type ActiveEffect = {
  spellKey: string
  casterId: number
  targetId: number
  duration: number
  armorBonus: number
  hasteBonus: number
  strengthBonus: number
  windsPower: number
  checkedFlag: boolean
  moneyReward: number
  itemReward: number
  landReward: number
}
