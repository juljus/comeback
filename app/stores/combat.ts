/**
 * Combat system module
 *
 * Extracted combat logic from the game store
 * All functions take game state and return mutations/results
 * Functions are designed to be called from the main game store actions
 */

import type {
  GameState,
  CombatState,
  Player,
  BoardSquare,
  CombatLogEntry,
  ReinforcementMob,
  CompanionInstance,
  MercenaryInstance,
} from './types'

import type {
  SpellType,
  ManaPool,
  LandType,
  MobType,
} from '~/data/schemas'

import {
  getMobByName,
  getSpellByName,
  getLevelupByName,
} from '~/data/schemas'

import {
  rollDamage,
  checkCriticalHit,
  checkImmunity,
  shouldDefenderFlee,
  attemptFlee,
  selectDefenderSpell,
  getPlayerTotalStats,
  getPlayerWeaponDamage,
  getLandType,
  getItemById,
} from './helpers'

/**
 * Initialize combat against the defender on current square
 *
 * Conditions:
 * - Player can conquer the current square
 * - Defender exists for the land type and tier
 *
 * Returns: true if combat started, false if invalid or auto-win
 */
export function startCombat(state: GameState): boolean {
  const player = state.players[state.currentPlayer]
  if (!player) return false

  const square = state.board[player.position]
  if (!square) return false

  // Get defender based on land type and tier
  const landType = getLandType(square.landTypeId)
  if (!landType) return false

  const defenderName = landType.defenders[square.defenderTier - 1] ?? landType.defenders[0] ?? ''
  if (!defenderName) return false

  const defender = getMobByName(defenderName)

  if (!defender) {
    // No valid defender, auto-win
    square.owner = player.index
    return true
  }

  // Use persisted HP if defender was damaged in previous combat, otherwise full HP
  const defenderHp = square.defenderCurrentHp ?? defender.hp

  // Initialize combat state
  state.combat = {
    active: true,
    squareIndex: square.index,
    defenderName: defender.name.en,
    defenderMaxHp: defender.hp,
    defenderHp: defenderHp,
    defenderArmor: defender.armor,
    defenderDamage: defender.damage,
    defenderAttacksPerRound: defender.attacksPerRound,
    defenderDamageType: defender.damageType ?? 'crush',
    defenderStats: defender.stats,
    defenderElementalDamage: defender.elementalDamage,
    defenderImmunities: defender.immunities,
    // AI and spellcasting
    defenderAI: defender.aiBehavior,
    defenderMana: { ...defender.mana }, // Copy to avoid mutating base data
    defenderManaRegen: defender.manaRegen,
    defenderSpells: defender.spells,
    defenderSpellLevelBonus: defender.spellLevelBonus,
    defenderHasFled: false,
    attackerHpAtStart: player.hp,
    round: 1,
    log: [],
    // Status effects initialized to zero
    defenderBleeding: 0,
    defenderStunnedTurns: 0,
    defenderPoisoned: 0,
    defenderBurningTurns: 0,
    defenderFrozenTurns: 0,
    attackerBleeding: 0,
    attackerStunnedTurns: 0,
    attackerFrozenTurns: 0,
    attackerPoisoned: 0,
    attackerBurningTurns: 0,
    fleeAttemptedThisRound: false,
    // Reinforcements initialized empty
    reinforcements: [],
    pendingReinforcements: [],
  }

  // Mark this land as attacked this turn (prevents re-attack after timeout)
  square.attackedThisTurn = true

  // Switch to combat phase
  state.phase = 'combat'

  // Log combat start
  state.combat.log.push({
    round: 0,
    actor: 'System',
    action: 'start',
    message: `Combat begins! ${player.name} vs ${defender.name.en}`,
  })

  return true
}

/**
 * Execute one round of combat (attack action)
 * Each attack = 1 action point
 *
 * Damage type effects (from VBA research):
 * - Pierce: Critical = DEX vs DEX+5, Effect = 100% armor bypass
 * - Slash: Critical = (STR + DEX/2) vs DEX+3, Effect = bleeding (50% of damage dealt)
 * - Crush: Critical = STR*2 vs DEX^3+2, Effect = stun for 2 turns
 */
export function attackInCombat(state: GameState): CombatLogEntry[] | null {
  if (state.phase !== 'combat' || !state.combat?.active) return null

  const player = state.players[state.currentPlayer]
  if (!player) return null

  const combat = state.combat
  const results: CombatLogEntry[] = []

  // Process bleeding damage on defender at start of round
  if (combat.defenderBleeding > 0) {
    combat.defenderHp -= combat.defenderBleeding
    results.push({
      round: combat.round,
      actor: 'System',
      action: 'bleeding',
      damage: combat.defenderBleeding,
      message: `${combat.defenderName} takes ${combat.defenderBleeding} bleeding damage!`,
    })

    // Check if defender defeated by bleeding
    if (combat.defenderHp <= 0) {
      combat.defenderHp = 0
      results.push({
        round: combat.round,
        actor: 'System',
        action: 'victory',
        message: `${combat.defenderName} bleeds out! ${player.name} claims the land!`,
      })
      combat.log.push(...results)
      endCombat(state, true)
      return results
    }
  }

  // Process poison damage on defender
  if (combat.defenderPoisoned > 0) {
    combat.defenderHp -= combat.defenderPoisoned
    results.push({
      round: combat.round,
      actor: 'System',
      action: 'poison',
      damage: combat.defenderPoisoned,
      message: `${combat.defenderName} takes ${combat.defenderPoisoned} poison damage!`,
    })

    // Check if defender defeated by poison
    if (combat.defenderHp <= 0) {
      combat.defenderHp = 0
      results.push({
        round: combat.round,
        actor: 'System',
        action: 'victory',
        message: `${combat.defenderName} is poisoned to death! ${player.name} claims the land!`,
      })
      combat.log.push(...results)
      endCombat(state, true)
      return results
    }
  }

  // Process burning damage on defender
  if (combat.defenderBurningTurns > 0) {
    const burnDamage = 3 // Fixed burn damage per round
    combat.defenderHp -= burnDamage
    combat.defenderBurningTurns--
    results.push({
      round: combat.round,
      actor: 'System',
      action: 'burning',
      damage: burnDamage,
      message: `${combat.defenderName} burns for ${burnDamage} damage! (${combat.defenderBurningTurns} turns left)`,
    })

    // Check if defender defeated by burning
    if (combat.defenderHp <= 0) {
      combat.defenderHp = 0
      results.push({
        round: combat.round,
        actor: 'System',
        action: 'victory',
        message: `${combat.defenderName} burns to death! ${player.name} claims the land!`,
      })
      combat.log.push(...results)
      endCombat(state, true)
      return results
    }
  }

  // Check if defender is frozen (skip their turn)
  if (combat.defenderFrozenTurns > 0) {
    combat.defenderFrozenTurns--
    results.push({
      round: combat.round,
      actor: 'System',
      action: 'frozen',
      damage: 0,
      message: `${combat.defenderName} is frozen and cannot act! (${combat.defenderFrozenTurns} turns left)`,
    })
  }

  // Process bleeding damage on player at start of round
  if (combat.attackerBleeding > 0) {
    player.hp -= combat.attackerBleeding
    results.push({
      round: combat.round,
      actor: 'System',
      action: 'bleeding',
      damage: combat.attackerBleeding,
      message: `${player.name} takes ${combat.attackerBleeding} bleeding damage!`,
    })

    // Check if player defeated by bleeding
    if (player.hp <= 0) {
      player.hp = 0
      player.isAlive = false
      results.push({
        round: combat.round,
        actor: 'System',
        action: 'defeat',
        message: `${player.name} bleeds out!`,
      })
      combat.log.push(...results)
      endCombat(state, false)
      return results
    }
  }

  // Process poison damage on attacker
  if (combat.attackerPoisoned > 0) {
    player.hp -= combat.attackerPoisoned
    results.push({
      round: combat.round,
      actor: 'System',
      action: 'poison',
      damage: combat.attackerPoisoned,
      message: `${player.name} takes ${combat.attackerPoisoned} poison damage!`,
    })

    // Check if player defeated by poison
    if (player.hp <= 0) {
      player.hp = 0
      player.isAlive = false
      results.push({
        round: combat.round,
        actor: 'System',
        action: 'defeat',
        message: `${player.name} is poisoned to death!`,
      })
      combat.log.push(...results)
      endCombat(state, false)
      return results
    }
  }

  // Process burning damage on attacker
  if (combat.attackerBurningTurns > 0) {
    const burnDamage = 3 // Fixed burn damage per round
    player.hp -= burnDamage
    combat.attackerBurningTurns--
    results.push({
      round: combat.round,
      actor: 'System',
      action: 'burning',
      damage: burnDamage,
      message: `${player.name} burns for ${burnDamage} damage! (${combat.attackerBurningTurns} turns left)`,
    })

    // Check if player defeated by burning
    if (player.hp <= 0) {
      player.hp = 0
      player.isAlive = false
      results.push({
        round: combat.round,
        actor: 'System',
        action: 'defeat',
        message: `${player.name} burns to death!`,
      })
      combat.log.push(...results)
      endCombat(state, false)
      return results
    }
  }

  // Check if attacker is frozen
  if (combat.attackerFrozenTurns > 0) {
    combat.attackerFrozenTurns--
    results.push({
      round: combat.round,
      actor: 'System',
      action: 'frozen',
      damage: 0,
      message: `${player.name} is frozen and cannot act! (${combat.attackerFrozenTurns} turns left)`,
    })
  }

  // Move pending reinforcements to active at the start of each round
  // (they arrived at end of previous round, now they can act)
  if (combat.pendingReinforcements.length > 0) {
    combat.reinforcements.push(...combat.pendingReinforcements)
    combat.pendingReinforcements = []
  }

  // Check if player is stunned (skip their attack)
  if (combat.attackerStunnedTurns > 0) {
    combat.attackerStunnedTurns--
    results.push({
      round: combat.round,
      actor: player.name,
      action: 'stunned',
      message: `${player.name} is stunned and cannot attack!`,
    })
  } else if (combat.attackerFrozenTurns > 0) {
    // Check if attacker is frozen (skip attacks)
    results.push({
      round: combat.round,
      actor: player.name,
      action: 'skip',
      damage: 0,
      message: `${player.name} is frozen and cannot attack!`,
    })
  } else {
    // Player attacks (using total stats including equipment)
    const playerStats = getPlayerTotalStats(player)
    const weaponDamage = getPlayerWeaponDamage(player)
    const playerAttacks = playerStats.strikes

    for (let i = 0; i < playerAttacks; i++) {
      const rawDamage = rollDamage(weaponDamage.diceCount, weaponDamage.diceSides, weaponDamage.bonus)

      // Check for critical hit based on damage type
      const damageType = weaponDamage.damageType as 'pierce' | 'slash' | 'crush'
      const isCritical = checkCriticalHit(
        damageType,
        playerStats.strength,
        playerStats.dexterity,
        combat.defenderStats.dexterity
      )

      let damage: number
      let critMessage = ''

      if (isCritical) {
        switch (damageType) {
          case 'pierce':
            // Pierce crit: 100% armor bypass
            damage = rawDamage
            critMessage = ' (CRITICAL: armor pierced!)'
            break
          case 'slash':
            // Slash crit: normal damage + apply bleeding if damage > 3
            damage = Math.max(0, rawDamage - combat.defenderArmor)
            if (damage > 3) {
              // Check bleeding immunity
              if (!checkImmunity(combat.defenderImmunities.bleeding)) {
                const bleedAmount = Math.floor(damage * 0.5)
                combat.defenderBleeding += bleedAmount
                critMessage = ` (CRITICAL: bleeding for ${bleedAmount}/round!)`
              } else {
                critMessage = ' (CRITICAL: but immunity protected!)'
              }
            } else {
              critMessage = ' (CRITICAL: but damage too low for bleeding)'
            }
            break
          case 'crush':
            // Crush crit: normal damage + stun if damage > 5
            damage = Math.max(0, rawDamage - combat.defenderArmor)
            if (damage > 5) {
              // Check stun immunity
              if (!checkImmunity(combat.defenderImmunities.stun)) {
                combat.defenderStunnedTurns = 2
                critMessage = ' (CRITICAL: stunned for 2 turns!)'
              } else {
                critMessage = ' (CRITICAL: but immunity protected!)'
              }
            } else {
              critMessage = ' (CRITICAL: but damage too low for stun)'
            }
            break
          default:
            damage = Math.max(0, rawDamage - combat.defenderArmor)
        }
      } else {
        damage = Math.max(0, rawDamage - combat.defenderArmor)
      }

      combat.defenderHp -= damage

      const armorUsed = isCritical && damageType === 'pierce' ? 0 : combat.defenderArmor
      results.push({
        round: combat.round,
        actor: player.name,
        action: isCritical ? 'critical' : 'attack',
        damage,
        message: `${player.name} hits for ${damage} damage (${rawDamage} - ${armorUsed} armor)${critMessage}`,
      })
    }

    // Companion attacks
    for (const companion of player.companions) {
      if (companion.hp <= 0) continue // Skip dead companions
      if (combat.defenderHp <= 0) break // Stop if defender already dead

      for (let i = 0; i < companion.attacksPerRound; i++) {
        const rawDamage = rollDamage(companion.damage.diceCount, companion.damage.diceSides)
        const damage = Math.max(0, rawDamage - combat.defenderArmor)
        combat.defenderHp -= damage

        results.push({
          round: combat.round,
          actor: companion.name,
          action: 'attack',
          damage,
          message: `${companion.name} hits for ${damage} damage`,
        })
      }
    }

    // Mercenary attacks
    for (const merc of player.mercenaries) {
      if (merc.hp <= 0) continue // Skip dead mercenaries
      if (combat.defenderHp <= 0) break // Stop if defender already dead

      for (let i = 0; i < merc.attacksPerRound; i++) {
        const rawDamage = rollDamage(merc.damage.diceCount, merc.damage.diceSides)
        const damage = Math.max(0, rawDamage - combat.defenderArmor)
        combat.defenderHp -= damage

        results.push({
          round: combat.round,
          actor: merc.name,
          action: 'attack',
          damage,
          message: `${merc.name} (mercenary) hits for ${damage} damage`,
        })
      }
    }

    // Check if main defender defeated
    if (combat.defenderHp <= 0) {
      combat.defenderHp = 0
      // Check if there are reinforcements to take over
      if (combat.reinforcements.length > 0) {
        const nextDefender = combat.reinforcements.shift()!
        results.push({
          round: combat.round,
          actor: 'System',
          action: 'defender_defeated',
          message: `${combat.defenderName} defeated! ${nextDefender.name} steps forward to defend!`,
        })
        // Promote reinforcement to main defender
        combat.defenderName = nextDefender.name
        combat.defenderHp = nextDefender.hp
        combat.defenderMaxHp = nextDefender.maxHp
        combat.defenderArmor = nextDefender.armor
        combat.defenderDamage = nextDefender.damage
        combat.defenderAttacksPerRound = nextDefender.attacksPerRound
        combat.defenderDamageType = nextDefender.damageType
        // Reset status effects for new defender
        combat.defenderBleeding = 0
        combat.defenderStunnedTurns = 0
      } else {
        // No more defenders - victory!
        results.push({
          round: combat.round,
          actor: 'System',
          action: 'victory',
          message: `${combat.defenderName} defeated! ${player.name} claims the land!`,
        })
        combat.log.push(...results)
        endCombat(state, true)
        return results
      }
    }
  }

  // Check if defender is stunned (skip their attack)
  if (combat.defenderStunnedTurns > 0) {
    combat.defenderStunnedTurns--
    results.push({
      round: combat.round,
      actor: combat.defenderName,
      action: 'stunned',
      message: `${combat.defenderName} is stunned and cannot attack!`,
    })
  } else if (combat.defenderFrozenTurns > 0) {
    // Check if defender is frozen (skip attacks)
    results.push({
      round: combat.round,
      actor: combat.defenderName,
      action: 'skip',
      damage: 0,
      message: `${combat.defenderName} is frozen and cannot attack!`,
    })
  } else if (combat.defenderHasFled) {
    // Defender has already fled, skip their turn
    results.push({
      round: combat.round,
      actor: combat.defenderName,
      action: 'skip',
      damage: 0,
      message: `${combat.defenderName} has fled the battle!`,
    })
  } else {
    // Defender's turn: check flee, spellcast, or melee
    const playerStats = getPlayerTotalStats(player)

    // Step 1: Check if defender should attempt to flee
    if (shouldDefenderFlee(combat.defenderAI.bravery, combat.defenderHp, combat.defenderMaxHp)) {
      const fleeResult = attemptFlee(combat.defenderStats.dexterity, playerStats.dexterity)

      if (fleeResult.success) {
        // Defender successfully flees
        combat.defenderHasFled = true
        results.push({
          round: combat.round,
          actor: combat.defenderName,
          action: 'flee',
          message: `${combat.defenderName} flees the battle! (rolled ${fleeResult.roll}, needed ${fleeResult.needed})`,
        })
        // Defender fled, player wins the land
        results.push({
          round: combat.round,
          actor: 'System',
          action: 'victory',
          message: `${player.name} claims the land as the defender flees!`,
        })
        combat.log.push(...results)
        endCombat(state, true)
        return results
      } else {
        // Failed flee attempt - defender gets attacked for free
        results.push({
          round: combat.round,
          actor: combat.defenderName,
          action: 'flee_fail',
          message: `${combat.defenderName} tries to flee but is caught! (rolled ${fleeResult.roll}, needed ${fleeResult.needed})`,
        })
        // Player gets a free attack on failed flee (simplified - one attack)
        const rawDamage = rollDamage(
          getPlayerWeaponDamage(player).diceCount,
          getPlayerWeaponDamage(player).diceSides
        )
        const damage = Math.max(0, rawDamage - combat.defenderArmor)
        combat.defenderHp -= damage
        results.push({
          round: combat.round,
          actor: player.name,
          action: 'attack',
          damage,
          message: `${player.name} strikes the fleeing ${combat.defenderName} for ${damage} damage!`,
        })

        // Check if defender defeated by free attack
        if (combat.defenderHp <= 0) {
          combat.defenderHp = 0
          results.push({
            round: combat.round,
            actor: 'System',
            action: 'victory',
            message: `${combat.defenderName} is slain while fleeing! ${player.name} claims the land!`,
          })
          combat.log.push(...results)
          endCombat(state, true)
          return results
        }
        // After failed flee, defender doesn't get to attack this round
      }
    } else {
      // Step 2: Check for spellcasting
      const chosenSpell = selectDefenderSpell(
        combat.defenderSpells,
        combat.defenderMana,
        combat.defenderStats.power
      )

      if (chosenSpell) {
        // Cast the spell
        const spellResults = defenderCastSpell(state, chosenSpell, combat, player, playerStats)
        results.push(...spellResults)

        // Check if player defeated by spell
        if (player.hp <= 0) {
          player.hp = 0
          player.isAlive = false
          results.push({
            round: combat.round,
            actor: 'System',
            action: 'defeat',
            message: `${player.name} has been slain!`,
          })
          combat.log.push(...results)
          endCombat(state, false)
          return results
        }
      } else {
        // Step 3: Melee attack (original logic)
        for (let i = 0; i < combat.defenderAttacksPerRound; i++) {
          const rawDamage = rollDamage(
            combat.defenderDamage.diceCount,
            combat.defenderDamage.diceSides
          )

          // Check for critical hit based on defender's damage type
          const defenderDamageType = combat.defenderDamageType
          const isCritical = checkCriticalHit(
            defenderDamageType,
            combat.defenderStats.strength,
            combat.defenderStats.dexterity,
            playerStats.dexterity
          )

          let damage: number
          let critMessage = ''

          if (isCritical) {
            switch (defenderDamageType) {
              case 'pierce':
                // Pierce crit: 100% armor bypass
                damage = rawDamage
                critMessage = ' (CRITICAL: armor pierced!)'
                break
              case 'slash':
                // Slash crit: normal damage + apply bleeding if damage > 3
                damage = Math.max(0, rawDamage - playerStats.armor)
                if (damage > 3) {
                  const bleedAmount = Math.floor(damage * 0.5)
                  combat.attackerBleeding += bleedAmount
                  critMessage = ` (CRITICAL: bleeding for ${bleedAmount}/round!)`
                } else {
                  critMessage = ' (CRITICAL: but damage too low for bleeding)'
                }
                break
              case 'crush':
                // Crush crit: normal damage + stun if damage > 5
                damage = Math.max(0, rawDamage - playerStats.armor)
                if (damage > 5) {
                  combat.attackerStunnedTurns = 2
                  critMessage = ' (CRITICAL: stunned for 2 turns!)'
                } else {
                  critMessage = ' (CRITICAL: but damage too low for stun)'
                }
                break
              default:
                damage = Math.max(0, rawDamage - playerStats.armor)
            }
          } else {
            // Use player's total armor (base from strength + equipment)
            damage = Math.max(0, rawDamage - playerStats.armor)
          }

          player.hp -= damage

          results.push({
            round: combat.round,
            actor: combat.defenderName,
            action: isCritical ? 'critical' : 'attack',
            damage,
            message: `${combat.defenderName} hits for ${damage} damage${critMessage}`,
          })
        }

        // Apply defender's elemental damage
        const elemDmg = combat.defenderElementalDamage
        let totalElemental = 0

        // Fire damage (can cause burning)
        if (elemDmg.fire > 0) {
          totalElemental += elemDmg.fire
          // 20% chance to apply burning for 3 turns (unless immune)
          if (Math.random() < 0.2 && combat.attackerBurningTurns === 0 && !combat.defenderImmunities.fire) {
            combat.attackerBurningTurns = 3
            results.push({
              round: combat.round,
              actor: combat.defenderName,
              action: 'burn_apply',
              damage: 0,
              message: `${player.name} is set on fire!`,
            })
          }
        }

        // Cold damage (can cause frozen)
        if (elemDmg.cold > 0) {
          totalElemental += elemDmg.cold
          // 15% chance to freeze for 1 turn (unless immune)
          if (Math.random() < 0.15 && combat.attackerFrozenTurns === 0 && !combat.defenderImmunities.cold) {
            combat.attackerFrozenTurns = 1
            results.push({
              round: combat.round,
              actor: combat.defenderName,
              action: 'freeze_apply',
              damage: 0,
              message: `${player.name} is frozen solid!`,
            })
          }
        }

        // Poison damage (applies poison DoT)
        if (elemDmg.poison > 0) {
          totalElemental += elemDmg.poison
          // 25% chance to poison (unless immune)
          if (Math.random() < 0.25 && combat.attackerPoisoned === 0 && !combat.defenderImmunities.poison) {
            combat.attackerPoisoned = Math.floor(elemDmg.poison / 2)
            results.push({
              round: combat.round,
              actor: combat.defenderName,
              action: 'poison_apply',
              damage: 0,
              message: `${player.name} is poisoned for ${combat.attackerPoisoned} damage per round!`,
            })
          }
        }

        // Air damage (just direct damage, no status effect)
        if (elemDmg.air > 0) {
          totalElemental += elemDmg.air
        }

        // Apply total elemental damage to player
        if (totalElemental > 0) {
          player.hp -= totalElemental
          results.push({
            round: combat.round,
            actor: combat.defenderName,
            action: 'elemental',
            damage: totalElemental,
            message: `${combat.defenderName} deals ${totalElemental} elemental damage`,
          })
        }

        // Check if player defeated after main defender attack
        if (player.hp <= 0) {
          player.hp = 0
          player.isAlive = false
          results.push({
            round: combat.round,
            actor: 'System',
            action: 'defeat',
            message: `${player.name} has been slain!`,
          })
          combat.log.push(...results)
          endCombat(state, false)
          return results
        }
      } // End of melee attack else block
    } // End of flee check else block
  }

  // Reinforcement mobs attack (simpler attack, no crits)
  // Reinforcements target companions/mercenaries first if available
  const playerStats = getPlayerTotalStats(player)
  const aliveCompanions = player.companions.filter(c => c.hp > 0)
  const aliveMercenaries = player.mercenaries.filter(m => m.hp > 0)

  for (const reinforcement of combat.reinforcements) {
    if (reinforcement.hp <= 0) continue // Skip dead reinforcements

    for (let i = 0; i < reinforcement.attacksPerRound; i++) {
      const rawDamage = rollDamage(
        reinforcement.damage.diceCount,
        reinforcement.damage.diceSides
      )

      // Target alive companions/mercenaries first, then player
      const companionTarget = aliveCompanions.find(c => c.hp > 0)
      const mercTarget = aliveMercenaries.find(m => m.hp > 0)

      if (companionTarget) {
        const damage = Math.max(0, rawDamage - companionTarget.armor)
        companionTarget.hp -= damage

        results.push({
          round: combat.round,
          actor: reinforcement.name,
          action: 'attack',
          damage,
          message: `${reinforcement.name} attacks ${companionTarget.name} for ${damage} damage`,
        })

        // Remove dead companions
        if (companionTarget.hp <= 0) {
          results.push({
            round: combat.round,
            actor: 'System',
            action: 'companion_defeated',
            message: `${companionTarget.name} has been slain!`,
          })
        }
      } else if (mercTarget) {
        const damage = Math.max(0, rawDamage - mercTarget.armor)
        mercTarget.hp -= damage

        results.push({
          round: combat.round,
          actor: reinforcement.name,
          action: 'attack',
          damage,
          message: `${reinforcement.name} attacks ${mercTarget.name} for ${damage} damage`,
        })

        // Remove dead mercenaries
        if (mercTarget.hp <= 0) {
          results.push({
            round: combat.round,
            actor: 'System',
            action: 'mercenary_defeated',
            message: `${mercTarget.name} has been slain!`,
          })
        }
      } else {
        // No companions/mercenaries, attack player
        const damage = Math.max(0, rawDamage - playerStats.armor)
        player.hp -= damage

        results.push({
          round: combat.round,
          actor: reinforcement.name,
          action: 'attack',
          damage,
          message: `${reinforcement.name} (reinforcement) hits for ${damage} damage`,
        })

        // Check if player defeated
        if (player.hp <= 0) {
          player.hp = 0
          player.isAlive = false
          results.push({
            round: combat.round,
            actor: 'System',
            action: 'defeat',
            message: `${player.name} has been slain!`,
          })
          combat.log.push(...results)
          endCombat(state, false)
          return results
        }
      }
    }
  }

  // Clean up dead companions and mercenaries
  player.companions = player.companions.filter(c => c.hp > 0)
  player.mercenaries = player.mercenaries.filter(m => m.hp > 0)

  // Check for adjacent land reinforcements at end of round
  const reinforcementResults = checkReinforcements(state)
  results.push(...reinforcementResults)

  combat.log.push(...results)
  combat.round++
  combat.fleeAttemptedThisRound = false // Reset flee attempt for new round

  // Combat timeout at round 4 (VBA: max 4 combat rounds per battle)
  // Combat does NOT consume player turn actions - it runs until resolved
  if (combat.round >= 4 && combat.active) {
    combat.log.push({
      round: combat.round,
      actor: 'System',
      action: 'timeout',
      message: 'Night falls. Combat ends - land not captured.',
    })
    endCombat(state, false)
  }

  return results
}

/**
 * Check for reinforcements from adjacent lands
 * Called at the end of each combat round
 *
 * Reinforcement conditions (ALL must be true):
 * 1. Adjacent land has same landTypeId as combat location
 * 2. Adjacent land has same owner (not neutral, owner !== null)
 * 3. Adjacent land's defender hasn't already reinforced this turn
 *
 * Reinforcement arrives next round (added to pendingReinforcements)
 */
export function checkReinforcements(state: GameState): CombatLogEntry[] {
  if (!state.combat?.active) return []

  const results: CombatLogEntry[] = []
  const combatSquare = state.board[state.combat.squareIndex]
  if (!combatSquare) return []

  const boardSize = state.board.length
  const combatPosition = state.combat.squareIndex

  // Check position-1 and position+1 (wrap around board)
  const adjacentPositions = [
    (combatPosition - 1 + boardSize) % boardSize,
    (combatPosition + 1) % boardSize,
  ]

  for (const adjPos of adjacentPositions) {
    const adjSquare = state.board[adjPos]
    if (!adjSquare) continue

    // Check all reinforcement conditions
    // 1. Same land type as combat location
    if (adjSquare.landTypeId !== combatSquare.landTypeId) continue

    // 2. Same owner (not neutral) - must match the combat square's owner
    if (adjSquare.owner === null) continue
    if (adjSquare.owner !== combatSquare.owner) continue

    // 3. Hasn't already reinforced this turn
    if (adjSquare.reinforcedThisTurn) continue

    // Get the defender mob from this adjacent land
    const landType = getLandType(adjSquare.landTypeId)
    if (!landType) continue

    const defenderName = landType.defenders[adjSquare.defenderTier - 1] ?? landType.defenders[0]
    if (!defenderName) continue

    const defender = getMobByName(defenderName)
    if (!defender) continue

    // Mark this land as having reinforced
    adjSquare.reinforcedThisTurn = true

    // Create reinforcement mob
    const reinforcement: ReinforcementMob = {
      name: defender.name.en,
      hp: defender.hp,
      maxHp: defender.hp,
      armor: defender.armor,
      damage: defender.damage,
      attacksPerRound: defender.attacksPerRound,
      damageType: defender.damageType ?? 'crush',
      fromSquareIndex: adjSquare.index,
      fromSquareName: adjSquare.name,
    }

    // Add to pending (will act next round)
    state.combat.pendingReinforcements.push(reinforcement)

    // Log the reinforcement arrival
    results.push({
      round: state.combat.round,
      actor: 'System',
      action: 'reinforcement',
      message: `${defender.name.en} from ${adjSquare.name} joins the battle!`,
    })
  }

  return results
}

/**
 * Flee from combat
 *
 * VBA formula (line 12556-12626):
 * - fleeja_Bonus = 2 (base for runner)
 * - chasija_Bonus = 1 (base for chaser)
 * - flee_vahe = player_dex - defender_dex
 * - If flee_vahe > 0 (player faster): fleeja_Bonus += (1 + flee_vahe)²
 * - If flee_vahe < 0 (defender faster): chasija_Bonus += (1 + |flee_vahe|)²
 * - Roll 1 to (fleeja_Bonus + chasija_Bonus)
 * - Success if roll > chasija_Bonus
 * - On failed flee, defender gets a free hit!
 */
export function fleeCombat(state: GameState): boolean {
  if (state.phase !== 'combat' || !state.combat?.active) return false

  const player = state.players[state.currentPlayer]
  if (!player) return false

  const combat = state.combat

  // Cannot flee again after failed attempt in same round
  if (combat.fleeAttemptedThisRound) {
    combat.log.push({
      round: combat.round,
      actor: 'System',
      action: 'flee_blocked',
      message: 'Cannot flee again this round!',
    })
    return false
  }

  combat.fleeAttemptedThisRound = true

  // VBA formula for flee chance
  const playerStats = getPlayerTotalStats(player)
  const playerDex = playerStats.dexterity
  const defenderDex = combat.defenderStats.dexterity

  let fleejaBonus = 2 // Base for runner (fleeja = "one who flees" in Estonian)
  let chaserBonus = 1 // Base for chaser (chasija)

  const dexDiff = playerDex - defenderDex
  if (dexDiff > 0) {
    // Player is faster - higher flee chance
    fleejaBonus += (1 + dexDiff) * (1 + dexDiff)
  } else if (dexDiff < 0) {
    // Defender is faster - lower flee chance
    const absDiff = Math.abs(dexDiff)
    chaserBonus += (1 + absDiff) * (1 + absDiff)
  }

  // Roll 1 to (fleejaBonus + chaserBonus)
  const total = fleejaBonus + chaserBonus
  const roll = Math.floor(Math.random() * total) + 1
  const fleeChancePercent = Math.round((fleejaBonus / total) * 100)

  combat.log.push({
    round: combat.round,
    actor: 'System',
    action: 'flee_odds',
    message: `Flee odds: ${fleeChancePercent}% (Runner ${fleejaBonus} vs Chaser ${chaserBonus})`,
  })

  if (roll > chaserBonus) {
    // Successful flee
    combat.log.push({
      round: combat.round,
      actor: player.name,
      action: 'flee',
      message: `${player.name} successfully flees from combat!`,
    })
    endCombat(state, false)
    return true
  } else {
    // Failed flee - defender gets a free hit!
    combat.log.push({
      round: combat.round,
      actor: player.name,
      action: 'flee_fail',
      message: `${player.name} tries to flee but fails!`,
    })

    // Defender gets free attack on failed flee (VBA line 12616)
    const rawDamage = rollDamage(
      combat.defenderDamage.diceCount,
      combat.defenderDamage.diceSides
    )
    const damage = Math.max(0, rawDamage - playerStats.armor)
    player.hp -= damage

    combat.log.push({
      round: combat.round,
      actor: combat.defenderName,
      action: 'opportunity_attack',
      damage,
      message: `${combat.defenderName} strikes the fleeing ${player.name} for ${damage} damage!`,
    })

    // Check if player died from the opportunity attack
    if (player.hp <= 0) {
      player.hp = 0
      player.isAlive = false
      combat.log.push({
        round: combat.round,
        actor: 'System',
        action: 'defeat',
        message: `${player.name} was slain while fleeing!`,
      })
      endCombat(state, false)
    }

    // Failed flee does NOT consume action - combat runs independently
    return false
  }
}

/**
 * Defender casts a spell during combat
 * VBA: one_turn_spell (lines 12050-12185)
 *
 * Damage formula: INT((knowledge * basePower + random(0, power/2)) * caster_power / target_power - random(0, target_power))
 * Vampiric: heal = INT(((vampiric% + 25 * knowledge) / 100) * damage)
 */
export function defenderCastSpell(
  state: GameState,
  spell: SpellType,
  combat: CombatState,
  player: Player,
  playerStats: { strength: number; dexterity: number; power: number; armor: number }
): CombatLogEntry[] {
  const results: CombatLogEntry[] = []

  // Deduct mana cost
  const manaType = spell.manaType as keyof ManaPool
  combat.defenderMana[manaType] -= spell.manaCost

  // Calculate spell knowledge (base 1 + spellLevelBonus)
  const knowledge = 1 + combat.defenderSpellLevelBonus

  results.push({
    round: combat.round,
    actor: combat.defenderName,
    action: 'spell',
    message: `${combat.defenderName} casts ${spell.name.en}!`,
  })

  // Handle different spell types
  if (spell.type === 'damage' && spell.basePower > 0) {
    // Damage spell calculation
    const casterPower = combat.defenderStats.power
    const targetPower = playerStats.power || 1 // Avoid division by zero

    // VBA formula: INT((knowledge * basePower + random(0, power/2)) * caster_power / target_power - random(0, target_power))
    const bonusDamage = Math.floor(Math.random() * (casterPower / 2))
    const baseCalc = knowledge * spell.basePower + bonusDamage
    const powerRatio = casterPower / targetPower
    const resistance = Math.floor(Math.random() * targetPower)

    let damage = Math.floor(baseCalc * powerRatio - resistance)
    damage = Math.max(0, damage) // No negative damage

    // Apply damage to player
    player.hp -= damage

    results.push({
      round: combat.round,
      actor: combat.defenderName,
      action: 'spell_damage',
      damage,
      message: `${spell.name.en} deals ${damage} damage to ${player.name}!`,
    })

    // Handle vampiric effect
    if (spell.effects.vampiricPercent > 0 && damage > 0) {
      // VBA formula: INT(((vampiric% + 25 * knowledge) / 100) * damage)
      const vampPercent = spell.effects.vampiricPercent + (25 * knowledge)
      const healAmount = Math.floor((vampPercent / 100) * damage)

      if (healAmount > 0) {
        const oldHp = combat.defenderHp
        combat.defenderHp = Math.min(combat.defenderMaxHp, combat.defenderHp + healAmount)
        const actualHeal = combat.defenderHp - oldHp

        if (actualHeal > 0) {
          results.push({
            round: combat.round,
            actor: combat.defenderName,
            action: 'heal',
            damage: -actualHeal,
            message: `${combat.defenderName} drains ${actualHeal} life from ${player.name}!`,
          })
        }
      }
    }
  } else if (spell.type === 'buff' || spell.effects.hasHeal) {
    // Healing/buff spell - defender heals itself
    const healAmount = Math.floor(knowledge * spell.basePower * 0.5)
    const oldHp = combat.defenderHp
    combat.defenderHp = Math.min(combat.defenderMaxHp, combat.defenderHp + healAmount)
    const actualHeal = combat.defenderHp - oldHp

    if (actualHeal > 0) {
      results.push({
        round: combat.round,
        actor: combat.defenderName,
        action: 'heal',
        damage: -actualHeal,
        message: `${combat.defenderName} heals for ${actualHeal}!`,
      })
    }
  }

  // Regenerate mana at end of defender's spell turn
  for (const mType of Object.keys(combat.defenderMana) as (keyof ManaPool)[]) {
    combat.defenderMana[mType] += combat.defenderManaRegen[mType]
  }

  return results
}

/**
 * End combat and return to playing phase
 */
export function endCombat(state: GameState, victory: boolean): void {
  if (!state.combat) return

  const player = state.players[state.currentPlayer]
  const square = state.board[state.combat.squareIndex]

  if (victory && player && square) {
    // Player wins - take ownership
    square.owner = player.index
    // Reset defender HP since defender was defeated (new defender on next upgrade)
    square.defenderCurrentHp = null
    // Note: checkTitlePromotion would be called here in the game store
  } else if (square) {
    // Combat ended without victory (timeout or player fled/died)
    // Save defender's current HP so damage persists to next combat
    square.defenderCurrentHp = state.combat.defenderHp
  }

  // Process pet evolution progress for surviving pets
  // VBA: +1 evolution point per combat round for pets with evolution targets
  if (player) {
    const combatRounds = state.combat.round
    for (const companion of player.companions) {
      // Only pets (not summons) with evolution targets gain progress
      if (companion.isPet && companion.evolvesInto && companion.hp > 0) {
        companion.evolutionProgress += combatRounds

        // Check for evolution (threshold is 10, VBA: > 9)
        while (companion.evolutionProgress >= 10 && companion.evolvesInto) {
          evolvePet(state, player, companion)
          companion.evolutionProgress -= 9 // Carry over excess
        }
      }
    }
  }

  // Clear combat state
  state.combat.active = false
  state.phase = 'playing'

  // If player died, check for game over
  const alivePlayers = state.players.filter(p => p.isAlive)
  if (alivePlayers.length <= 1) {
    state.phase = 'finished'
  }
}

/**
 * Evolve a pet to its next form
 * VBA: level_up_mob (lines 13525-13637)
 *
 * Applies stat bonuses, learns spells, gains resistances
 */
function evolvePet(state: GameState, player: Player, companion: CompanionInstance): void {
  const evolutionData = getLevelupByName(companion.evolvesInto)
  if (!evolutionData) return

  // Apply HP bonus
  companion.maxHp += evolutionData.hpBonus
  companion.hp = Math.min(companion.hp + evolutionData.hpBonus, companion.maxHp)

  // Apply attacks bonus
  companion.attacksPerRound += evolutionData.attacksBonus

  // Apply damage bonus
  companion.damage.diceCount += evolutionData.damageBonus.diceCount
  companion.damage.diceSides += evolutionData.damageBonus.diceSides

  // Apply stat bonuses
  companion.stats.strength += evolutionData.statBonuses.strength
  companion.stats.dexterity += evolutionData.statBonuses.dexterity
  companion.stats.power += evolutionData.statBonuses.power

  // Apply armor bonus
  companion.armor += evolutionData.armorBonus

  // Learn new spells (add to player's spell knowledge if not already known)
  for (const spellName of evolutionData.learnsSpells) {
    if (!player.spellKnowledge[spellName]) {
      player.spellKnowledge[spellName] = 1
    } else {
      // Already known - increase knowledge level
      player.spellKnowledge[spellName]++
    }
  }

  // Update name to evolved form
  const oldName = companion.name
  companion.name = evolutionData.name.en

  // Set next evolution target
  companion.evolvesInto = evolutionData.evolvesInto

  // Log evolution (add to combat log if still in combat)
  if (state.combat) {
    state.combat.log.push({
      round: state.combat.round,
      actor: 'System',
      action: 'evolution',
      message: `${oldName} evolved into ${companion.name}!`,
    })
  }
}
