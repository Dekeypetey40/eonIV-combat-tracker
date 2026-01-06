/**
 * Reaction Roll Functionality
 * 
 * Handles rolling Reaction for combatants and sorting by results.
 * Uses the Eon RPG system's existing dice roller.
 */

import { MODULE_ID } from "./types";
import { getCombatantsByPhase, getFlags, setPhase } from "./flags";
import { EonPhase } from "./types";

/**
 * Roll Reaction for a combatant using the Eon system's dice roller
 */
export async function rollReaction(combatant: Combatant): Promise<number | null> {
  const actor = combatant.actor;
  if (!actor) {
    console.warn(`${MODULE_ID} | No actor found for combatant`);
    return null;
  }

  try {
    // Try to use the Eon system's dice roller
    // The Eon system typically has a "reaktion" or "reaction" skill/ability
    // Check common paths for the Reaction ability
    
    // Method 1: Try direct roll if the system exposes it
    if ((actor as any).rollReaction) {
      const roll = await (actor as any).rollReaction();
      return roll?.total ?? null;
    }

    // Method 2: Try to use the Eon system's built-in roller if available
    // Check if the system has a rollReaction or similar method
    if ((actor as any).system?.rollReaction) {
      const roll = await (actor as any).system.rollReaction();
      return roll?.total ?? null;
    }

    // Method 3: Try to find and roll the Reaction skill/ability
    // Eon system typically stores abilities under system.harleddegenskaper or similar
    const system = actor.system as any;
    
    // Common paths in Eon system for Reaction
    const reactionPaths = [
      system.reaktion,
      system.reaction,
      system.harleddegenskaper?.reaktion,
      system.harleddegenskaper?.reaction,
      system.fardigheter?.reaktion,
      system.fardigheter?.reaction,
      system.egenskaper?.reaktion,
      system.egenskaper?.reaction,
    ];

    let reactionValue: number | null = null;
    for (const path of reactionPaths) {
      if (path && typeof path === "object") {
        // Try common property names
        reactionValue = path.value ?? path.total ?? path.mod ?? path.base ?? null;
        if (reactionValue !== null) break;
      } else if (typeof path === "number") {
        reactionValue = path;
        break;
      }
    }

    if (reactionValue === null || reactionValue === undefined) {
      console.warn(`${MODULE_ID} | Could not find Reaction value for ${actor.name}`);
      ui.notifications.warn(`Could not find Reaction for ${actor.name}. Check that the actor has a Reaction ability.`);
      return null;
    }

    // Roll using Foundry's standard roll system
    // Eon uses T6 (d6) dice - roll the reaction value as T6
    const rollFormula = `${reactionValue}d6`;
    const roll = new Roll(rollFormula);
    await roll.roll({ async: true });
    
    // Display the roll in chat
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      flavor: `Reaktionsslag - ${actor.name}`,
    });

    return roll.total ?? null;
  } catch (error) {
    console.error(`${MODULE_ID} | Error rolling Reaction:`, error);
    ui.notifications.error(`Failed to roll Reaction for ${actor.name}`);
    return null;
  }
}

/**
 * Roll Reaction for all combatants in a phase and sort them by result
 */
export async function rollReactionForPhase(combat: Combat, phase: EonPhase): Promise<void> {
  const combatantsByPhase = getCombatantsByPhase(combat);
  const phaseCombatants = combatantsByPhase.get(phase) || [];

  if (phaseCombatants.length === 0) {
    ui.notifications.info("No combatants in this phase");
    return;
  }

  if (phaseCombatants.length === 1) {
    ui.notifications.info("Only one combatant in this phase");
    return;
  }

  // Roll for all combatants
  const rolls: Array<{ combatant: Combatant; result: number }> = [];
  
  for (const combatant of phaseCombatants) {
    const result = await rollReaction(combatant);
    if (result !== null) {
      rolls.push({ combatant, result });
    }
  }

  if (rolls.length === 0) {
    ui.notifications.warn("No valid reaction rolls");
    return;
  }

  // Sort by roll result (highest first)
  rolls.sort((a, b) => b.result - a.result);

  // Update order flags based on sorted position
  // Use order values that reflect the roll results
  for (let i = 0; i < rolls.length; i++) {
    const { combatant } = rolls[i];
    const flags = getFlags(combatant);
    // Use the roll result * 1000 as the order to preserve roll order
    // This way, if rolls are equal, we can still distinguish them
    const order = (rolls.length - i) * 1000 + (rolls[i].result * 10);
    await setPhase(combatant, phase, order, combat.round ?? 1);
  }

  ui.notifications.info(`Sorted ${rolls.length} combatants by Reaction roll`);
}

