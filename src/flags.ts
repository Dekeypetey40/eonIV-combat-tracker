/**
 * Flag management utilities for Eon IV Combat Tracker
 * 
 * Handles reading and writing phase assignment data on Combatant documents.
 */

import { MODULE_ID, DEFAULT_FLAGS, EonCombatantFlags, EonPhase } from "./types";

/**
 * Get the Eon combat flags for a combatant
 */
export function getFlags(combatant: Combatant): EonCombatantFlags {
  const phase = combatant.getFlag(MODULE_ID, "phase") as EonPhase | undefined;
  const order = combatant.getFlag(MODULE_ID, "order") as number | undefined;
  const round = combatant.getFlag(MODULE_ID, "round") as number | undefined;

  return {
    phase: phase ?? DEFAULT_FLAGS.phase,
    order: order ?? DEFAULT_FLAGS.order,
    round: round ?? DEFAULT_FLAGS.round,
  };
}

/**
 * Set the phase for a combatant
 */
export async function setPhase(
  combatant: Combatant,
  phase: EonPhase,
  order: number,
  round: number
): Promise<void> {
  await combatant.setFlag(MODULE_ID, "phase", phase);
  await combatant.setFlag(MODULE_ID, "order", order);
  await combatant.setFlag(MODULE_ID, "round", round);
}

/**
 * Reset all combatants in a combat to "none" phase
 */
export async function resetAllPhases(combat: Combat): Promise<void> {
  const updates = combat.combatants.map((c) => ({
    _id: c.id,
    [`flags.${MODULE_ID}.phase`]: "none",
    [`flags.${MODULE_ID}.order`]: 0,
    [`flags.${MODULE_ID}.round`]: combat.round ?? 0,
  }));
  
  await combat.updateEmbeddedDocuments("Combatant", updates);
}

/**
 * Get combatants grouped by phase, sorted by order
 */
export function getCombatantsByPhase(combat: Combat): Map<EonPhase, Combatant[]> {
  const phases: Map<EonPhase, Combatant[]> = new Map([
    ["ranged", []],
    ["melee", []],
    ["mystic", []],
    ["none", []],
  ]);

  for (const combatant of combat.combatants) {
    const flags = getFlags(combatant);
    const phaseList = phases.get(flags.phase);
    if (phaseList) {
      phaseList.push(combatant);
    }
  }

  // Sort each phase by order
  for (const [, combatants] of phases) {
    combatants.sort((a, b) => getFlags(a).order - getFlags(b).order);
  }

  return phases;
}

